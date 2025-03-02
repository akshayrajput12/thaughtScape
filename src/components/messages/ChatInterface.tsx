
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Profile, CallLog } from '@/types';
import { initializePeerConnection, addStreamToPeer, handleICECandidate } from '@/utils/webrtc';
import { CallControls } from '@/components/messages/CallControls';
import { CallView } from '@/components/messages/CallView';
import { IncomingCallDialog } from '@/components/messages/IncomingCallDialog';

interface ChatInterfaceProps {
  currentUser: Profile;
  selectedUser: Profile;
  onBack?: () => void;
}

interface UserPresence {
  user_id: string;
  presence_ref: string;
  isTyping?: boolean;
  lastActive?: string;
}

export const ChatInterface = ({ currentUser, selectedUser, onBack }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, UserPresence>>({});
  const [isInCall, setIsInCall] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [incomingCall, setIncomingCall] = useState<{
    callId: string;
    caller: {
      id: string;
      username: string;
      avatar_url?: string;
    };
    isVideo: boolean;
  } | null>(null);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Fetch message history
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        setMessages(data || []);
        
        // Mark messages as read
        const unreadMessages = data?.filter(
          msg => msg.receiver_id === currentUser.id && !msg.is_read
        ) || [];
        
        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadMessages.map(msg => msg.id));
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    
    // Fetch call logs
    const fetchCallLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('call_logs')
          .select('*')
          .or(`caller_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (error) throw error;
        setCallLogs(data || []);
      } catch (error) {
        console.error('Error fetching call logs:', error);
      }
    };
    
    fetchMessages();
    fetchCallLogs();
    
    // Set up presence channel
    const channel = supabase.channel('online-users');
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const formattedState: Record<string, UserPresence> = {};
        
        Object.keys(newState).forEach(key => {
          const userPresence = newState[key][0] as UserPresence;
          formattedState[key] = {
            user_id: key,
            presence_ref: userPresence.presence_ref,
            isTyping: userPresence.isTyping || false,
            lastActive: userPresence.lastActive || new Date().toISOString()
          };
        });
        
        setOnlineUsers(formattedState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUser.id,
            isTyping: false,
            lastActive: new Date().toISOString()
          });
        }
      });
      
    // Subscribe to real-time messages
    const messageSubscription = supabase
      .channel('messages-channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new as any;
          if (
            (newMessage.sender_id === currentUser.id && newMessage.receiver_id === selectedUser.id) ||
            (newMessage.sender_id === selectedUser.id && newMessage.receiver_id === currentUser.id)
          ) {
            setMessages(prev => [...prev, newMessage]);
            
            // Mark message as read if it's from the selected user
            if (newMessage.sender_id === selectedUser.id) {
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMessage.id)
                .then();
            }
          }
        }
      )
      .subscribe();
      
    // Subscribe to typing indicators
    const typingSubscription = supabase
      .channel(`typing-${selectedUser.id}-${currentUser.id}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id === selectedUser.id) {
          setRecipientTyping(payload.isTyping);
        }
      })
      .subscribe();
      
    // Subscribe to call requests
    const callSubscription = supabase
      .channel(`call-${currentUser.id}`)
      .on('broadcast', { event: 'call-request' }, ({ payload }) => {
        if (payload.caller.id === selectedUser.id) {
          setIncomingCall(payload);
          // Play ringtone or notification sound
          const audio = new Audio('/ringtone.mp3');
          audio.loop = true;
          audio.play().catch(console.error);
        }
      })
      .subscribe();
      
    // Clean up subscriptions
    return () => {
      messageSubscription.unsubscribe();
      typingSubscription.unsubscribe();
      callSubscription.unsubscribe();
      channel.unsubscribe();
    };
  }, [currentUser.id, selectedUser.id]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Log call
  const logCall = async (callType: 'audio' | 'video', status: 'completed' | 'missed' | 'rejected', duration?: number) => {
    try {
      await supabase
        .from('call_logs')
        .insert({
          caller_id: currentUser.id,
          recipient_id: selectedUser.id,
          call_type: callType,
          status: status,
          start_time: new Date().toISOString(),
          end_time: status !== 'completed' ? new Date().toISOString() : null,
          duration: duration || null
        });
    } catch (error) {
      console.error('Error logging call:', error);
    }
  };
  
  // Handle typing indicator
  const handleTyping = () => {
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Broadcast typing status if not already typing
    if (!isTyping) {
      setIsTyping(true);
      
      // Send typing indicator to the other user
      supabase
        .channel(`typing-${currentUser.id}-${selectedUser.id}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: { user_id: currentUser.id, isTyping: true }
        })
        .then();
    }
    
    // Set timeout to stop typing indicator after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      
      // Send typing stopped to the other user
      supabase
        .channel(`typing-${currentUser.id}-${selectedUser.id}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: { user_id: currentUser.id, isTyping: false }
        })
        .then();
    }, 3000);
  };
  
  // Call functions
  const initializeCall = async (withVideo: boolean) => {
    try {
      // Initialize WebRTC
      peerConnectionRef.current = initializePeerConnection();
      
      // Get local media stream
      const constraints = { 
        audio: true, 
        video: withVideo 
      };
      
      const localStream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = localStream;
      
      // Display local stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      
      // Add tracks to peer connection
      addStreamToPeer(peerConnectionRef.current, localStream);
      
      // Set up ICE candidate handling
      handleICECandidate(peerConnectionRef.current, (candidate) => {
        if (candidate) {
          // Send ICE candidate to peer via signaling server
          supabase
            .channel(`call-signaling-${currentUser.id}-${selectedUser.id}`)
            .send({
              type: 'broadcast',
              event: 'ice-candidate',
              payload: { candidate: candidate.toJSON() }
            })
            .then();
        }
      });
      
      // Handle incoming tracks
      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteStreamRef.current = event.streams[0];
        }
      };
      
      return true;
    } catch (error) {
      console.error('Error initializing call:', error);
      toast({
        title: "Call Error",
        description: "Could not access camera/microphone",
        variant: "destructive",
      });
      return false;
    }
  };
  
  const startCall = async (withVideo: boolean) => {
    if (await initializeCall(withVideo)) {
      setIsInCall(true);
      setIsVideo(withVideo);
      
      // Create and send offer
      try {
        const offer = await peerConnectionRef.current?.createOffer();
        await peerConnectionRef.current?.setLocalDescription(offer);
        
        // Send offer to recipient via signaling server
        supabase
          .channel(`call-${selectedUser.id}`)
          .send({
            type: 'broadcast',
            event: 'call-request',
            payload: {
              callId: `${currentUser.id}-${selectedUser.id}-${Date.now()}`,
              caller: {
                id: currentUser.id,
                username: currentUser.username,
                avatar_url: currentUser.avatar_url
              },
              isVideo: withVideo,
              offer: offer
            }
          })
          .then();
          
        // Log call start
        logCall(withVideo ? 'video' : 'audio', 'completed');
      } catch (error) {
        console.error('Error creating offer:', error);
        endCall();
      }
    }
  };
  
  const acceptCall = async () => {
    if (!incomingCall) return;
    
    if (await initializeCall(incomingCall.isVideo)) {
      setIsInCall(true);
      setIsVideo(incomingCall.isVideo);
      
      // Stop ringtone
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      
      try {
        // Create and send answer
        const answer = await peerConnectionRef.current?.createAnswer();
        await peerConnectionRef.current?.setLocalDescription(answer);
        
        // Send answer to caller via signaling server
        supabase
          .channel(`call-signaling-${incomingCall.caller.id}-${currentUser.id}`)
          .send({
            type: 'broadcast',
            event: 'call-answer',
            payload: {
              answer: answer,
              callId: incomingCall.callId
            }
          })
          .then();
          
        setIncomingCall(null);
      } catch (error) {
        console.error('Error accepting call:', error);
        endCall();
      }
    } else {
      rejectCall();
    }
  };
  
  const rejectCall = () => {
    if (!incomingCall) return;
    
    // Send rejection to caller
    supabase
      .channel(`call-signaling-${incomingCall.caller.id}-${currentUser.id}`)
      .send({
        type: 'broadcast',
        event: 'call-rejected',
        payload: {
          callId: incomingCall.callId
        }
      })
      .then();
      
    // Log rejected call
    logCall(incomingCall.isVideo ? 'video' : 'audio', 'rejected');
    
    // Stop ringtone
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    
    setIncomingCall(null);
  };
  
  const endCall = () => {
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Send end call to peer
    supabase
      .channel(`call-signaling-${currentUser.id}-${selectedUser.id}`)
      .send({
        type: 'broadcast',
        event: 'call-ended',
        payload: {}
      })
      .then();
      
    setIsInCall(false);
    setIsVideo(false);
  };
  
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };
  
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideo(videoTrack.enabled);
      }
    }
  };
  
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      setIsTyping(false);
      
      // Send typing stopped
      supabase
        .channel(`typing-${currentUser.id}-${selectedUser.id}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: { user_id: currentUser.id, isTyping: false }
        })
        .then();
    }
    
    try {
      const { error, data } = await supabase
        .from('messages')
        .insert({
          content: newMessage.trim(),
          sender_id: currentUser.id,
          receiver_id: selectedUser.id,
        })
        .select();
        
      if (error) throw error;
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };
  
  // Render component
  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-300 relative overflow-hidden">
              {selectedUser.avatar_url ? (
                <img src={selectedUser.avatar_url} alt={selectedUser.username} className="h-full w-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-primary text-white font-medium text-lg">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                onlineUsers[selectedUser.id] ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
            </div>
            <div className="ml-3">
              <div className="font-medium">{selectedUser.full_name || selectedUser.username}</div>
              <div className="text-xs text-gray-500">
                {recipientTyping ? (
                  <span className="text-primary">Typing...</span>
                ) : onlineUsers[selectedUser.id] ? (
                  <span>Online</span>
                ) : (
                  <span>Offline</span>
                )}
              </div>
            </div>
          </div>
        </div>
        {!isInCall && (
          <div className="flex gap-2">
            <button 
              onClick={() => startCall(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
              aria-label="Start audio call"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </button>
            <button 
              onClick={() => startCall(true)}
              className="p-2 hover:bg-gray-100 rounded-full"
              aria-label="Start video call"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                <path d="M14 6a2 2 0 012-2h1a2 2 0 012 2v8a2 2 0 01-2 2h-1a2 2 0 01-2-2V6z" />
              </svg>
            </button>
          </div>
        )}
        {isInCall && (
          <CallControls
            isInCall={isInCall}
            isVideo={isVideo}
            isMuted={isMuted}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onStartCall={() => {}}
            onEndCall={endCall}
          />
        )}
      </div>
      
      {/* Main content area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Call view */}
        {isInCall && (
          <CallView
            isInCall={isInCall}
            isVideo={isVideo}
            isMuted={isMuted}
            selectedUserId={selectedUser.id}
            currentUserId={currentUser.id}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onCallEnd={endCall}
          />
        )}
        
        {/* Messages */}
        {!isInCall && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`mb-4 flex ${message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender_id !== currentUser.id && (
                    <div className="h-8 w-8 rounded-full bg-gray-300 mr-2 overflow-hidden">
                      {selectedUser.avatar_url ? (
                        <img src={selectedUser.avatar_url} alt={selectedUser.username} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full bg-primary text-white font-medium">
                          {selectedUser.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.sender_id === currentUser.id
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-gray-100 rounded-tl-none'
                    }`}
                  >
                    <div>{message.content}</div>
                    <div className={`text-xs mt-1 ${message.sender_id === currentUser.id ? 'text-primary-foreground/70' : 'text-gray-500'}`}>
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {message.sender_id === currentUser.id && (
                        <span className="ml-1">
                          {message.is_read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {recipientTyping && (
                <div className="flex items-center mb-4">
                  <div className="h-8 w-8 rounded-full bg-gray-300 mr-2 overflow-hidden">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt={selectedUser.username} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full bg-primary text-white font-medium">
                        {selectedUser.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message input */}
            <div className="border-t p-4">
              <div className="flex items-center">
                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                      handleTyping();
                    }}
                    placeholder="Type a message..."
                    className="w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    rows={1}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="ml-2 p-2 bg-primary text-white rounded-full disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Incoming call dialog */}
      <IncomingCallDialog
        call={incomingCall}
        onAccept={acceptCall}
        onReject={rejectCall}
      />
    </div>
  );
};
