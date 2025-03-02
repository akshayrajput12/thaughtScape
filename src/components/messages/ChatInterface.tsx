import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Message, Profile, CallLog } from '@/types';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';
import { WebRTCConnection } from '@/utils/webrtc';
import CallView from './CallView';
import IncomingCallDialog from './IncomingCallDialog';

interface ChatInterfaceProps {
  currentUser: Profile;
  selectedUser: Profile | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  sendMessage: (content: string) => Promise<void>;
}

const ChatInterface = ({
  currentUser,
  selectedUser,
  messages,
  setMessages,
  sendMessage
}: ChatInterfaceProps) => {
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastActive, setLastActive] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ callId: string; caller: Profile; isVideo: boolean } | null>(null);
  const [activeCall, setActiveCall] = useState<{ callId: string; peer: Profile; isVideo: boolean } | null>(null);
  const [callHistory, setCallHistory] = useState<CallLog[]>([]);
  const [showCallHistory, setShowCallHistory] = useState(false);
  
  const webRTCRef = useRef<WebRTCConnection | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!selectedUser) return;
    
    const fetchCallHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('call_logs')
          .select('*')
          .or(`caller_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (error) throw error;
        
        setCallHistory(data as CallLog[]);
      } catch (error) {
        console.error('Error fetching call history:', error);
      }
    };
    
    fetchCallHistory();
  }, [selectedUser, currentUser.id]);
  
  useEffect(() => {
    if (!currentUser) return;
    
    const channel = supabase.channel(`user:${currentUser.id}`)
      .on('broadcast', { event: 'call-request' }, ({ payload }) => {
        const request = payload as { callId: string; caller: Profile; isVideo: boolean };
        setIncomingCall(request);
        
        const audio = new Audio('/sounds/ringtone.mp3');
        audio.loop = true;
        audio.play().catch(e => console.error('Could not play ringtone:', e));
        
        return () => {
          audio.pause();
          audio.currentTime = 0;
        };
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);
  
  useEffect(() => {
    if (!selectedUser) return;
    
    const channel = supabase.channel(`presence:${selectedUser.id}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const isUserOnline = Object.keys(state).length > 0;
        setIsOnline(isUserOnline);
        
        if (!isUserOnline && state[selectedUser.id]?.[0]?.last_active) {
          setLastActive(state[selectedUser.id][0].last_active);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser]);
  
  useEffect(() => {
    if (!selectedUser) return;
    
    const channel = supabase.channel(`typing:${currentUser.id}-${selectedUser.id}`)
      .on('broadcast', { event: 'typing' }, () => {
        setIsTyping(true);
        
        setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, currentUser.id]);
  
  const initiateCall = async (isVideo: boolean) => {
    if (!selectedUser) return;
    
    try {
      webRTCRef.current = new WebRTCConnection((stream) => {
        const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement;
        if (remoteVideo) {
          remoteVideo.srcObject = stream;
        }
      });
      
      await webRTCRef.current.initializeConnection(isVideo);
      const callId = await webRTCRef.current.initiateCall(currentUser.id, selectedUser.id, isVideo);
      
      const { error } = await supabase
        .from('call_logs')
        .insert({
          caller_id: currentUser.id,
          recipient_id: selectedUser.id,
          call_type: isVideo ? 'video' : 'audio',
          status: 'completed',
          start_time: new Date().toISOString()
        });
        
      if (error) throw error;
      
      setActiveCall({
        callId,
        peer: selectedUser,
        isVideo
      });
      
      toast({
        title: 'Call Initiated',
        description: `Calling ${selectedUser.username}...`,
      });
    } catch (error) {
      console.error('Error initiating call:', error);
      toast({
        title: 'Call Failed',
        description: 'Could not initiate call. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    
    try {
      webRTCRef.current = new WebRTCConnection((stream) => {
        const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement;
        if (remoteVideo) {
          remoteVideo.srcObject = stream;
        }
      });
      
      await webRTCRef.current.initializeConnection(incomingCall.isVideo);
      await webRTCRef.current.acceptCall(incomingCall.callId);
      
      setActiveCall({
        callId: incomingCall.callId,
        peer: incomingCall.caller,
        isVideo: incomingCall.isVideo
      });
      
      setIncomingCall(null);
    } catch (error) {
      console.error('Error accepting call:', error);
      toast({
        title: 'Call Failed',
        description: 'Could not accept call. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  const rejectIncomingCall = async () => {
    if (!incomingCall) return;
    
    try {
      const tempConnection = new WebRTCConnection(() => {});
      await tempConnection.rejectCall(incomingCall.callId);
      
      await supabase
        .from('call_logs')
        .insert({
          caller_id: incomingCall.caller.id,
          recipient_id: currentUser.id,
          call_type: incomingCall.isVideo ? 'video' : 'audio',
          status: 'rejected',
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString()
        });
      
      setIncomingCall(null);
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  };
  
  const endCall = async () => {
    if (!activeCall || !webRTCRef.current) return;
    
    webRTCRef.current.closeConnection();
    
    const endTime = new Date();
    const startTime = new Date(activeCall.callId.split('-')[2]);
    const durationInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    try {
      await supabase
        .from('call_logs')
        .update({
          end_time: endTime.toISOString(),
          duration: durationInSeconds,
          status: 'completed'
        })
        .eq('caller_id', currentUser.id)
        .eq('recipient_id', activeCall.peer.id)
        .order('created_at', { ascending: false })
        .limit(1);
    } catch (error) {
      console.error('Error updating call log:', error);
    }
    
    setActiveCall(null);
  };
  
  return (
    <div className="flex flex-col h-full">
      {incomingCall && (
        <IncomingCallDialog
          caller={incomingCall.caller}
          isVideo={incomingCall.isVideo}
          onAccept={acceptIncomingCall}
          onReject={rejectIncomingCall}
        />
      )}
      
      {activeCall && (
        <CallView
          peer={activeCall.peer}
          isVideo={activeCall.isVideo}
          onEndCall={endCall}
        />
      )}
      
      {!activeCall && selectedUser && (
        <>
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img 
                  src={selectedUser.avatar_url || '/default-avatar.png'} 
                  alt={selectedUser.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              </div>
              <div>
                <h3 className="font-medium">{selectedUser.full_name || selectedUser.username}</h3>
                <p className="text-xs text-gray-500">
                  {isOnline ? 'Online' : lastActive ? `Last seen ${new Date(lastActive).toLocaleString()}` : 'Offline'}
                </p>
                {isTyping && <p className="text-xs text-gray-500 italic">Typing...</p>}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => initiateCall(false)}
                className="rounded-full"
              >
                <i className="fas fa-phone"></i>
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => initiateCall(true)}
                className="rounded-full"
              >
                <i className="fas fa-video"></i>
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowCallHistory(!showCallHistory)}
                className="rounded-full"
              >
                <i className="fas fa-history"></i>
              </Button>
            </div>
          </div>
          
          {showCallHistory && (
            <div className="p-4 bg-gray-50 border-b max-h-64 overflow-y-auto">
              <h4 className="font-medium mb-2">Recent Calls</h4>
              {callHistory.length > 0 ? (
                <ul className="space-y-2">
                  {callHistory.map((call) => (
                    <li key={call.id} className="flex items-center justify-between p-2 bg-white rounded shadow-sm">
                      <div>
                        <p className="text-sm">
                          {call.caller_id === currentUser.id ? 'Outgoing' : 'Incoming'} {call.call_type} call
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(call.start_time).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {call.duration && (
                          <span className="text-xs mr-2">
                            {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs ${
                          call.status === 'completed' ? 'bg-green-100 text-green-800' :
                          call.status === 'missed' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {call.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No call history</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChatInterface;
