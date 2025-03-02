import { supabase } from "@/integrations/supabase/client";

export interface CallRequest {
  callId: string;
  caller: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  isVideo: boolean;
}

interface CallSignalPayload {
  type: 'offer' | 'answer' | 'candidate' | 'reject';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export const initializePeerConnection = (config?: RTCConfiguration): RTCPeerConnection => {
  const defaultConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  };
  
  return new RTCPeerConnection(config || defaultConfig);
};

export const addStreamToPeer = (peer: RTCPeerConnection, stream: MediaStream): void => {
  stream.getTracks().forEach(track => {
    peer.addTrack(track, stream);
  });
};

export const handleICECandidate = (
  peer: RTCPeerConnection, 
  onIceCandidate: (candidate: RTCIceCandidate | null) => void
): void => {
  peer.onicecandidate = (event) => {
    onIceCandidate(event.candidate);
  };
};

export class WebRTCConnection {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private onRemoteStream: (stream: MediaStream) => void;

  constructor(onRemoteStream: (stream: MediaStream) => void) {
    this.onRemoteStream = onRemoteStream;
  }

  async initializeConnection(isVideo: boolean): Promise<MediaStream> {
    try {
      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      });

      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });

      // Add local stream tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Handle incoming streams
      this.peerConnection.ontrack = (event) => {
        this.onRemoteStream(event.streams[0]);
      };

      return this.localStream;
    } catch (error) {
      console.error('Error initializing WebRTC connection:', error);
      throw error;
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peerConnection) return null;
    
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peerConnection) return null;
    
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Error handling offer:', error);
      throw error;
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;
    
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }

  async handleCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;
    
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
      throw error;
    }
  }

  closeConnection(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
      }
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
      }
    }
  }

  async initiateCall(callerId: string, receiverId: string, isVideo: boolean): Promise<string> {
    const callId = `${callerId}-${receiverId}-${Date.now()}`;
    
    // Send call request notification to receiver
    const receiverChannel = supabase.channel(`user:${receiverId}`);
    await receiverChannel.subscribe();
    
    await receiverChannel.send({
      type: 'broadcast',
      event: 'call-request',
      payload: {
        callId,
        caller: {
          id: callerId,
          username: (await supabase.from('profiles').select('username').eq('id', callerId).single()).data?.username,
          avatar_url: (await supabase.from('profiles').select('avatar_url').eq('id', callerId).single()).data?.avatar_url
        },
        isVideo
      }
    });

    // Set up WebRTC signaling channel
    const channel = supabase.channel(`call:${callId}`)
      .on('broadcast', { event: 'call-signal' }, async ({ payload }) => {
        const signalPayload = payload as CallSignalPayload;
        if (signalPayload.type === 'answer' && this.peerConnection && signalPayload.answer) {
          await this.handleAnswer(signalPayload.answer);
        } else if (signalPayload.type === 'candidate' && this.peerConnection && signalPayload.candidate) {
          await this.handleCandidate(signalPayload.candidate);
        } else if (signalPayload.type === 'reject') {
          this.closeConnection();
          throw new Error('Call rejected');
        }
      });
    
    await channel.subscribe();

    // Create and send offer
    const offer = await this.createOffer();
    if (offer) {
      await channel.send({
        type: 'broadcast',
        event: 'call-signal',
        payload: {
          type: 'offer',
          offer
        } as CallSignalPayload
      });
    }

    return callId;
  }

  async acceptCall(callId: string): Promise<void> {
    if (!this.peerConnection) return;

    const channel = supabase.channel(`call:${callId}`)
      .on('broadcast', { event: 'call-signal' }, async ({ payload }) => {
        const signalPayload = payload as CallSignalPayload;
        if (signalPayload.type === 'offer' && this.peerConnection && signalPayload.offer) {
          const answer = await this.handleOffer(signalPayload.offer);
          if (answer) {
            await channel.send({
              type: 'broadcast',
              event: 'call-signal',
              payload: {
                type: 'answer',
                answer
              } as CallSignalPayload
            });
          }
        } else if (signalPayload.type === 'candidate' && this.peerConnection && signalPayload.candidate) {
          await this.handleCandidate(signalPayload.candidate);
        }
      });

    await channel.subscribe();
  }

  async rejectCall(callId: string): Promise<void> {
    const channel = supabase.channel(`call:${callId}`);
    await channel.subscribe();

    await channel.send({
      type: 'broadcast',
      event: 'call-signal',
      payload: {
        type: 'reject'
      } as CallSignalPayload
    });

    channel.unsubscribe();
  }
}
