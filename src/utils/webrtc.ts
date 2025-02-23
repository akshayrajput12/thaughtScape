
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
    const channel = supabase.channel(`call:${callId}`)
      .on('broadcast', { event: 'call-signal' }, async (payload) => {
        if (payload.type === 'answer' && this.peerConnection) {
          await this.handleAnswer(payload.answer);
        } else if (payload.type === 'candidate' && this.peerConnection) {
          await this.handleCandidate(payload.candidate);
        }
      });
    
    await channel.subscribe();

    // Create and send offer
    const offer = await this.createOffer();
    if (offer) {
      await channel.send({
        type: 'broadcast',
        event: 'call-signal',
        payload: { type: 'offer', offer }
      });
    }

    return callId;
  }

  async acceptCall(callId: string): Promise<void> {
    if (!this.peerConnection) return;

    const channel = supabase.channel(`call:${callId}`)
      .on('broadcast', { event: 'call-signal' }, async (payload) => {
        if (payload.type === 'offer' && this.peerConnection) {
          const answer = await this.handleOffer(payload.offer);
          if (answer) {
            await channel.send({
              type: 'broadcast',
              event: 'call-signal',
              payload: { type: 'answer', answer }
            });
          }
        } else if (payload.type === 'candidate' && this.peerConnection) {
          await this.handleCandidate(payload.candidate);
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
      payload: { type: 'reject' }
    });

    channel.unsubscribe();
  }
}
