import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Phone, PhoneOff, Video, VideoOff } from 'lucide-react';
import { initializePeerConnection, addStreamToPeer, handleICECandidate } from '@/utils/webrtc';

interface ChatInterfaceProps {
  currentUserId: string;
  recipientId: string;
}

interface CallLog {
  id: string;
  caller_id: string;
  recipient_id: string;
  start_time: string;
  end_time: string | null;
  call_type: 'audio' | 'video';
  status: 'missed' | 'completed' | 'ongoing';
}

export const ChatInterface = ({ currentUserId, recipientId }: ChatInterfaceProps) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const currentCallId = useRef<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to call events
    const callChannel = supabase.channel(`calls:${currentUserId}`);
    
    callChannel
      .on('broadcast', { event: 'call-offer' }, async ({ payload }) => {
        if (payload.recipientId === currentUserId) {
          handleIncomingCall(payload);
        }
      })
      .on('broadcast', { event: 'call-answer' }, ({ payload }) => {
        if (payload.callerId === currentUserId) {
          handleCallAccepted(payload);
        }
      })
      .on('broadcast', { event: 'call-end' }, ({ payload }) => {
        if (payload.participantId === currentUserId) {
          handleCallEnded();
        }
      })
      .subscribe();

    // Fetch call logs
    fetchCallLogs();

    return () => {
      callChannel.unsubscribe();
      cleanupCall();
    };
  }, [currentUserId]);

  const fetchCallLogs = async () => {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .or(`caller_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching call logs:', error);
      return;
    }

    setCallLogs(data);
  };

  const initializeCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      const pc = await initializePeerConnection();
      peerConnection.current = pc;

      // Add local stream to peer connection
      await addStreamToPeer(pc, stream);

      // Handle incoming remote stream
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          handleICECandidate(event.candidate, currentUserId, recipientId);
        }
      };

      return pc;
    } catch (error) {
      console.error('Error initializing call:', error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
      return null;
    }
  };

  const startCall = async () => {
    const pc = await initializeCall();
    if (!pc) return;

    setIsCaller(true);
    setIsCallActive(true);

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Create call log
    const { data: callLog, error } = await supabase
      .from('call_logs')
      .insert({
        caller_id: currentUserId,
        recipient_id: recipientId,
        start_time: new Date().toISOString(),
        call_type: 'audio',
        status: 'ongoing'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating call log:', error);
      return;
    }

    currentCallId.current = callLog.id;

    // Send offer through Supabase channel
    await supabase.channel('calls').send({
      type: 'broadcast',
      event: 'call-offer',
      payload: {
        callerId: currentUserId,
        recipientId,
        offer,
        callId: callLog.id
      }
    });
  };

  const handleIncomingCall = async (payload: any) => {
    const pc = await initializeCall();
    if (!pc) return;

    setIsCaller(false);
    setIsCallActive(true);
    currentCallId.current = payload.callId;

    // Set remote description from offer
    await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));

    // Create and send answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Send answer through Supabase channel
    await supabase.channel('calls').send({
      type: 'broadcast',
      event: 'call-answer',
      payload: {
        callerId: payload.callerId,
        recipientId: currentUserId,
        answer,
        callId: payload.callId
      }
    });
  };

  const handleCallAccepted = async (payload: any) => {
    if (peerConnection.current) {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(payload.answer)
      );
    }
  };

  const endCall = async () => {
    if (currentCallId.current) {
      // Update call log
      await supabase
        .from('call_logs')
        .update({
          end_time: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', currentCallId.current);

      // Notify other participant
      await supabase.channel('calls').send({
        type: 'broadcast',
        event: 'call-end',
        payload: {
          participantId: recipientId,
          callId: currentCallId.current
        }
      });
    }

    handleCallEnded();
  };

  const handleCallEnded = () => {
    cleanupCall();
    setIsCallActive(false);
    setIsCaller(false);
    currentCallId.current = null;
    fetchCallLogs();
  };

  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (localAudioRef.current) {
      localAudioRef.current.srcObject = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Call Logs */}
        <div className="space-y-2">
          {callLogs.map((log) => (
            <div
              key={log.id}
              className={`p-3 rounded-lg ${log.caller_id === currentUserId ? 'bg-blue-50' : 'bg-gray-50'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {log.caller_id === currentUserId ? 'Outgoing Call' : 'Incoming Call'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(log.start_time).toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Duration: {log.end_time 
                  ? Math.round((new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 1000) + 's'
                  : 'Ongoing'}
              </div>
              <div className="text-xs text-gray-600">
                Status: {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call Controls */}
      <div className="p-4 border-t">
        <div className="flex justify-center space-x-4">
          {isCallActive ? (
            <Button
              variant="destructive"
              size="icon"
              onClick={endCall}
              className="h-12 w-12 rounded-full"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          ) : (
            <Button
              variant="default"
              size="icon"
              onClick={startCall}
              className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600"
            >
              <Phone className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>

      {/* Audio Elements */}
      <audio ref={localAudioRef} autoPlay muted />
      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
};