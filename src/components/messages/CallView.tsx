
import { useEffect, useRef, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { CallControls } from './CallControls';
import { WebRTCConnection } from '@/utils/webrtc';
import { supabase } from '@/integrations/supabase/client';

interface CallViewProps {
  isInCall: boolean;
  isVideo: boolean;
  isMuted: boolean;
  selectedUserId: string;
  currentUserId: string;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onCallEnd: () => void;
}

export const CallView = ({
  isInCall,
  isVideo,
  isMuted,
  selectedUserId,
  currentUserId,
  onToggleAudio,
  onToggleVideo,
  onCallEnd
}: CallViewProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const rtcConnectionRef = useRef<WebRTCConnection | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const { toast } = useToast();

  useEffect(() => {
    if (isInCall) {
      initializeCall();
    }

    return () => {
      if (rtcConnectionRef.current) {
        rtcConnectionRef.current.closeConnection();
      }
    };
  }, [isInCall]);

  const initializeCall = async () => {
    try {
      rtcConnectionRef.current = new WebRTCConnection((remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          setConnectionStatus('connected');
          toast({
            title: "Connected",
            description: "Call connection established successfully",
          });
        }
      });

      const localStream = await rtcConnectionRef.current.initializeConnection(isVideo);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      // Subscribe to call events
      const channel = supabase.channel(`call:${currentUserId}-${selectedUserId}`)
        .on('broadcast', { event: 'call-signal' }, async ({ payload }) => {
          if (!rtcConnectionRef.current) return;

          try {
            if (payload.type === 'offer') {
              const answer = await rtcConnectionRef.current.handleOffer(payload.offer);
              if (answer) {
                channel.send({
                  type: 'broadcast',
                  event: 'call-signal',
                  payload: { type: 'answer', answer }
                });
              }
            } else if (payload.type === 'answer') {
              await rtcConnectionRef.current.handleAnswer(payload.answer);
            } else if (payload.type === 'candidate') {
              await rtcConnectionRef.current.handleCandidate(payload.candidate);
            } else if (payload.type === 'end-call') {
              setConnectionStatus('disconnected');
              onCallEnd();
            }
          } catch (error) {
            console.error('Error handling WebRTC signal:', error);
            toast({
              title: "Call Error",
              description: "There was an error with the call connection",
              variant: "destructive"
            });
            setConnectionStatus('disconnected');
            onCallEnd();
          }
        })
        .subscribe();

      // Create and send offer
      const offer = await rtcConnectionRef.current.createOffer();
      if (offer) {
        channel.send({
          type: 'broadcast',
          event: 'call-signal',
          payload: { type: 'offer', offer }
        });
      }

      return () => {
        channel.unsubscribe();
      };
    } catch (error) {
      console.error('Error initializing call:', error);
      toast({
        title: "Call Error",
        description: "Could not access camera/microphone",
        variant: "destructive"
      });
      setConnectionStatus('disconnected');
      onCallEnd();
    }
  };

  return (
    <div className="absolute inset-0 bg-gray-900">
      {/* Connection Status Indicator */}
      <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
        connectionStatus === 'connecting' ? 'bg-yellow-500/80 text-yellow-50' :
        connectionStatus === 'connected' ? 'bg-green-500/80 text-green-50' :
        'bg-red-500/80 text-red-50'
      }`}>
        {connectionStatus === 'connecting' ? 'Connecting...' :
         connectionStatus === 'connected' ? 'Connected' :
         'Disconnected'}
      </div>

      <video
        ref={remoteVideoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
      />
      {isVideo && (
        <video
          ref={localVideoRef}
          className="absolute bottom-20 right-4 w-48 h-36 rounded-lg object-cover shadow-lg border-2 border-white/20 backdrop-blur-sm"
          autoPlay
          playsInline
          muted
        />
      )}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full p-2">
        <CallControls
          isInCall={isInCall}
          isVideo={isVideo}
          isMuted={isMuted}
          onToggleAudio={onToggleAudio}
          onToggleVideo={onToggleVideo}
          onStartCall={() => {}} // Not needed here
          onEndCall={onCallEnd}
        />
      </div>
    </div>
  );
};
