
import { supabase } from "@/integrations/supabase/client";
import { CallLog } from "@/types";

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
  private callStartTime: Date | null = null;
  private callId: string | null = null;

  constructor(onRemoteStream: (stream: MediaStream) => void) {
    this.onRemoteStream = onRemoteStream;
  }

  async initializeConnection(isVideo: boolean): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      });

      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });

      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

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
    
    this.logCallEnd();
  }
  
  private async logCallEnd(): Promise<void> {
    if (!this.callId || !this.callStartTime) return;
    
    try {
      // Call logging functionality removed as call_logs table doesn't exist
      console.log('Call ended:', {
        callId: this.callId,
        duration: Math.floor((new Date().getTime() - this.callStartTime.getTime()) / 1000)
      });
    } catch (error) {
      console.error('Error logging call end:', error);
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
    this.callId = callId;
    this.callStartTime = new Date();
    
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

    try {
      // Call logging functionality removed as call_logs table doesn't exist
      console.log('Call initiated:', {
        callId: callId,
        callerId: callerId,
        receiverId: receiverId,
        isVideo: isVideo,
        startTime: this.callStartTime.toISOString()
      });
    } catch (error) {
      console.error('Error logging call start:', error);
    }

    const channel = supabase.channel(`call:${callId}`)
      .on('broadcast', { event: 'call-signal' }, async ({ payload }) => {
        const signalPayload = payload as CallSignalPayload;
        if (signalPayload.type === 'answer' && this.peerConnection && signalPayload.answer) {
          await this.handleAnswer(signalPayload.answer);
        } else if (signalPayload.type === 'candidate' && this.peerConnection && signalPayload.candidate) {
          await this.handleCandidate(signalPayload.candidate);
        } else if (signalPayload.type === 'reject') {
          this.closeConnection();
          
          try {
            // Call rejection logging removed as call_logs table doesn't exist
            console.log('Call rejected:', {
              callId: callId,
              callerId: callerId,
              receiverId: receiverId,
              endTime: new Date().toISOString()
            });
          } catch (error) {
            console.error('Error updating call log for rejected call:', error);
          }
          
          throw new Error('Call rejected');
        }
      });
    
    await channel.subscribe();

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
    
    this.callId = callId;
    this.callStartTime = new Date();
    
    const callerId = callId.split('-')[0];
    const receiverId = callId.split('-')[1];

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
    
    try {
      // Call acceptance logging removed as call_logs table doesn't exist
      console.log('Call accepted:', {
        callId: callId,
        callerId: callerId,
        receiverId: receiverId
      });
    } catch (error) {
      console.error('Error updating call log for accepted call:', error);
    }
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
    
    try {
      const callerId = callId.split('-')[0];
      const receiverId = callId.split('-')[1];
      
      // Call rejection logging removed as call_logs table doesn't exist
      console.log('Call rejected:', {
        callId: callId,
        callerId: callerId,
        receiverId: receiverId,
        endTime: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating call log for rejected call:', error);
    }
  }
}
