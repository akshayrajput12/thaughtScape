
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

  async initializeConnection(isVideo: boolean) {
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

  async createOffer() {
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

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return;
    
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }

  async handleOffer(offer: RTCSessionDescriptionInit) {
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

  async handleCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) return;
    
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
      throw error;
    }
  }

  closeConnection() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
      }
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
      }
    }
  }

  async initiateCall(callerId: string, receiverId: string, isVideo: boolean): Promise<string> {
    const callId = `${callerId}-${receiverId}-${Date.now()}`;
    const channel = supabase.channel(`call:${callId}`);
    
    await channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'call-request',
          payload: {
            callId,
            isVideo
          }
        });
      }
    });

    return callId;
  }

  async acceptCall(callId: string) {
    if (!this.peerConnection) return;

    const channel = supabase.channel(`call:${callId}`);
    await channel.subscribe();

    channel.send({
      type: 'broadcast',
      event: 'call-accepted',
      payload: {
        callId
      }
    });
  }

  async rejectCall(callId: string) {
    const channel = supabase.channel(`call:${callId}`);
    await channel.subscribe();

    channel.send({
      type: 'broadcast',
      event: 'call-rejected',
      payload: {
        callId
      }
    });
  }
}
