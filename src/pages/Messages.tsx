import { useState, useEffect, useRef, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { MessageTabs } from "@/components/messages/MessageTabs";
import { SidebarContent } from "@/components/messages/SidebarContent";
import { ChatArea } from "@/components/messages/ChatArea";
import { CallView } from '@/components/messages/CallView';
import { IncomingCallDialog } from '@/components/messages/IncomingCallDialog';
import { CallRequest, WebRTCConnection } from '@/utils/webrtc';
import { Message, Profile, CallLog } from "@/types";

interface Conversation {
  user: Profile;
  lastMessage: Message;
  unreadCount: number;
}

const Messages = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messageRequests, setMessageRequests] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isInCall, setIsInCall] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState("chats");
  const [incomingCall, setIncomingCall] = useState<CallRequest | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showConversations, setShowConversations] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [messageCount, setMessageCount] = useState(0);
  const [followStatus, setFollowStatus] = useState<{[key: string]: boolean}>({});
  const callDurationInterval = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const rtcConnectionRef = useRef<WebRTCConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(session.user.id);
    };

    fetchCurrentUser();
  }, [navigate]);

  useEffect(() => {
    const fetchFollowStatus = async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId);

      if (error) {
        console.error('Error fetching follows:', error);
        return;
      }

      const followMap = data.reduce((acc, item) => {
        acc[item.following_id] = true;
        return acc;
      }, {} as Record<string, boolean>);

      setFollowStatus(followMap);
    };

    fetchFollowStatus();
  }, [currentUserId]);

  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!currentUserId || !selectedUser) return;
      
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', currentUserId)
        .eq('sender_id', selectedUser.id)
        .eq('is_read', false);
    };
    
    if (currentUserId && selectedUser) {
      markMessagesAsRead();
    }
  }, [currentUserId, selectedUser]);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchConversationsAndRequests = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, username, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId);

      if (followsError) {
        console.error('Error fetching follows:', followsError);
        return;
      }

      const followingMap = new Set(followsData.map(f => f.following_id));

      const conversationsMap = new Map<string, Conversation>();
      const requestsArray: Message[] = [];

      data.forEach((message: any) => {
        const typedMessage: Message = {
          ...message,
          is_request: message.is_request || false,
          request_status: message.request_status || null
        };
        
        const isOutgoing = typedMessage.sender_id === currentUserId;
        const otherUser = isOutgoing ? typedMessage.receiver : typedMessage.sender;
        
        if (!otherUser) return;

        const otherUserId = otherUser.id;
        
        if (
          !isOutgoing && 
          !followingMap.has(typedMessage.sender_id) && 
          (typedMessage.request_status === 'pending' || typedMessage.request_status === null)
        ) {
          requestsArray.push(typedMessage);
          return;
        }

        const existingConv = conversationsMap.get(otherUserId);

        if (!existingConv || new Date(typedMessage.created_at) > new Date(existingConv.lastMessage.created_at)) {
          conversationsMap.set(otherUserId, {
            user: otherUser,
            lastMessage: typedMessage,
            unreadCount: !isOutgoing && !typedMessage.is_read ? 1 : 0,
          });
        } else if (!isOutgoing && !typedMessage.is_read) {
          existingConv.unreadCount += 1;
          conversationsMap.set(otherUserId, existingConv);
        }
      });

      setConversations(Array.from(conversationsMap.values()));
      setMessageRequests(requestsArray);
    };

    fetchConversationsAndRequests();

    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new.sender_id === currentUserId || payload.new.receiver_id === currentUserId) {
            fetchConversationsAndRequests();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId || !selectedUser) return;

    const fetchMessages = async () => {
      const isFollowing = followStatus[selectedUser.id] || false;

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, username, full_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      const typedMessages: Message[] = data.map((msg: any) => ({
        ...msg,
        is_request: msg.is_request || false,
        request_status: msg.request_status || null
      }));

      let filteredMessages = typedMessages;
      
      if (activeTab === 'chats') {
        filteredMessages = typedMessages.filter(msg => 
          msg.request_status === 'accepted' || 
          msg.sender_id === currentUserId ||
          isFollowing
        );
      }

      setMessages(filteredMessages);
      
      const incomingMessageCount = typedMessages.filter(
        msg => msg.sender_id === selectedUser.id && msg.receiver_id === currentUserId
      ).length;
      
      setMessageCount(incomingMessageCount);

      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    fetchMessages();

    const subscription = supabase
      .channel('individual-messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUserId}` },
        (payload) => {
          if (payload.new.sender_id === selectedUser.id) {
            fetchMessages();
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUserId, selectedUser, activeTab, followStatus]);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || !currentUserId) {
        setSearchResults([]);
        return;
      }

      const { data, error } = await supabase
        .rpc('search_users', {
          search_query: searchQuery.trim(),
          current_user_id: currentUserId
        });

      if (error) {
        console.error('Error searching users:', error);
        return;
      }

      const profileResults: Profile[] = data.map((user: any) => ({
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        is_following: user.is_following,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      setSearchResults(profileResults);
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase.channel(`user:${currentUserId}`)
      .on('broadcast', { event: 'call-request' }, ({ payload }) => {
        setIncomingCall({
          callId: payload.callId,
          caller: payload.caller,
          isVideo: payload.isVideo
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentUserId]);

  useEffect(() => {
    const audio = new Audio('/ringtone.mp3');
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    if (incomingCall && audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.play().catch(console.error);
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [incomingCall]);

  useEffect(() => {
    if (isInCall) {
      callDurationInterval.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callDurationInterval.current) {
        clearInterval(callDurationInterval.current);
      }
      setCallDuration(0);
    }
    return () => {
      if (callDurationInterval.current) {
        clearInterval(callDurationInterval.current);
      }
    };
  }, [isInCall]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const directUserId = searchParams.get('user');
    if (directUserId) {
      const fetchUser = async () => {
        const { data: userData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', directUserId)
          .single();
        
        if (userData) {
          setSelectedUser(userData);
          if (isMobileView) {
            setShowConversations(false);
          }
        }
      };
      fetchUser();
    }
  }, [isMobileView]);

  const handleStartCall = async (withVideo: boolean) => {
    if (!selectedUser || !currentUserId) return;
    
    try {
      rtcConnectionRef.current = new WebRTCConnection((remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      const callId = await rtcConnectionRef.current.initiateCall(currentUserId, selectedUser.id, withVideo);

      setIsVideo(withVideo);
      setIsInCall(true);
      setIsMuted(false);

      toast({
        title: "Calling...",
        description: `Waiting for ${selectedUser.username} to accept`,
      });
    } catch (error) {
      console.error("Error starting call:", error);
      toast({
        title: "Error",
        description: "Could not start the call",
        variant: "destructive",
      });
    }
  };

  const handleEndCall = () => {
    if (rtcConnectionRef.current) {
      rtcConnectionRef.current.closeConnection();
      rtcConnectionRef.current = null;
    }
    setIsInCall(false);
    setIsVideo(false);
    setIsMuted(false);
    if (callDurationInterval.current) {
      clearInterval(callDurationInterval.current);
    }
    setCallDuration(0);
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;

    try {
      rtcConnectionRef.current = new WebRTCConnection((remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      await rtcConnectionRef.current.acceptCall(incomingCall.callId);
      setIncomingCall(null);
      setIsInCall(true);
      setIsVideo(incomingCall.isVideo);
      setIsMuted(false);

    } catch (error) {
      console.error("Error accepting call:", error);
      toast({
        title: "Error",
        description: "Could not accept the call",
        variant: "destructive",
      });
    }
  };

  const handleRejectCall = async () => {
    if (!incomingCall) return;

    try {
      rtcConnectionRef.current = new WebRTCConnection(() => {});
      await rtcConnectionRef.current.rejectCall(incomingCall.callId);
      setIncomingCall(null);
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  };

  const toggleAudio = () => {
    setIsMuted(!isMuted);
    if (rtcConnectionRef.current) {
      rtcConnectionRef.current.toggleAudio(!isMuted);
    }
  };

  const toggleVideo = () => {
    setIsVideo(!isVideo);
    if (rtcConnectionRef.current) {
      rtcConnectionRef.current.toggleVideo(!isVideo);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Error",
        description: "Speech recognition is not supported in this browser",
        variant: "destructive",
      });
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setTranscribedText(transcript);
        setNewMessage(transcript);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Speech recognition error:', error);
      toast({
        title: "Error",
        description: "Could not start speech recognition",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
    }
  };

  const toggleSpeechRecognition = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleAcceptRequest = async (senderId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ request_status: 'accepted' })
        .eq('sender_id', senderId)
        .eq('receiver_id', currentUserId)
        .eq('request_status', 'pending');

      if (error) throw error;

      const { data: senderData, error: senderError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', senderId)
        .single();

      if (senderError) throw senderError;

      setSelectedUser(senderData);
      
      setActiveTab('chats');

      toast({
        title: "Request accepted",
        description: `You can now chat with ${senderData.username}`,
      });
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      });
    }
  };

  const handleDeclineRequest = async (senderId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ request_status: 'declined' })
        .eq('sender_id', senderId)
        .eq('receiver_id', currentUserId)
        .eq('request_status', 'pending');

      if (error) throw error;

      if (selectedUser && selectedUser.id === senderId) {
        setSelectedUser(null);
      }

      toast({
        title: "Request declined",
        description: "The message request has been declined",
      });
    } catch (error) {
      console.error('Error declining request:', error);
      toast({
        title: "Error",
        description: "Failed to decline request",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUserId || !selectedUser || !newMessage.trim()) return;

    const isRequest = !followStatus[selectedUser.id];
    
    if (isRequest && messageCount >= 3) {
      toast({
        title: "Message limit reached",
        description: "You can only send up to 3 messages until the other user accepts your request",
        variant: "destructive",
      });
      return;
    }

    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      content: newMessage.trim(),
      sender_id: currentUserId,
      receiver_id: selectedUser.id,
      created_at: new Date().toISOString(),
      is_read: false,
      is_request: isRequest,
      request_status: isRequest ? 'pending' : null,
      sender: {
        id: currentUserId,
        username: 'You',
        full_name: 'You',
        avatar_url: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      receiver: selectedUser
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");
    setTranscribedText("");
    if (isListening) {
      stopListening();
    }

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    try {
      const { error, data } = await supabase
        .from('messages')
        .insert({
          content: optimisticMessage.content,
          sender_id: currentUserId,
          receiver_id: selectedUser.id,
          is_request: isRequest,
          request_status: isRequest ? 'pending' : null
        })
        .select()
        .single();

      if (error) throw error;

      if (isRequest) {
        setMessageCount(prev => prev + 1);
      }

      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? { 
          ...data,
          is_request: data.is_request || false,
          request_status: data.request_status || null,
          sender: optimisticMessage.sender,
          receiver: optimisticMessage.receiver
        } as Message : msg
      ));
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBackToList = () => {
    setShowConversations(true);
  };

  const handleSelectUser = (user: Profile) => {
    setSelectedUser(user);
    if (isMobileView) {
      setShowConversations(false);
    }
  };

  const requestsCount = messageRequests.reduce((acc, msg) => {
    if (!acc.includes(msg.sender_id)) {
      acc.push(msg.sender_id);
    }
    return acc;
  }, [] as string[]).length;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white to-primary/10 pt-20">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 min-h-[80vh]">
            {(!isMobileView || showConversations) && (
              <div className="md:border-r border-gray-200">
                <MessageTabs 
                  activeTab={activeTab} 
                  onTabChange={setActiveTab} 
                  requestsCount={requestsCount}
                >
                  <SidebarContent
                    activeTab={activeTab}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    conversations={conversations}
                    messageRequests={messageRequests}
                    searchResults={searchResults}
                    selectedUser={selectedUser}
                    onSelectUser={handleSelectUser}
                    onAcceptRequest={handleAcceptRequest}
                    onDeclineRequest={handleDeclineRequest}
                  />
                </MessageTabs>
              </div>
            )}

            {(!isMobileView || !showConversations) && (
              <div className="md:col-span-2 flex flex-col">
                {isInCall && selectedUser ? (
                  <CallView
                    isInCall={isInCall}
                    isVideo={isVideo}
                    isMuted={isMuted}
                    selectedUserId={selectedUser.id}
                    currentUserId={currentUserId!}
                    onToggleAudio={toggleAudio}
                    onToggleVideo={toggleVideo}
                    onCallEnd={handleEndCall}
                  />
                ) : (
                  <ChatArea
                    selectedUser={selectedUser}
                    currentUserId={currentUserId!}
                    messages={messages}
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                    followStatus={followStatus}
                    messageCount={messageCount}
                    isInCall={isInCall}
                    isVideo={isVideo}
                    isMuted={isMuted}
                    callDuration={callDuration}
                    isListening={isListening}
                    isMobileView={isMobileView}
                    messagesEndRef={messagesEndRef}
                    handleBackToList={handleBackToList}
                    handleStartCall={handleStartCall}
                    handleEndCall={handleEndCall}
                    toggleAudio={toggleAudio}
                    toggleVideo={toggleVideo}
                    toggleSpeechRecognition={toggleSpeechRecognition}
                    sendMessage={sendMessage}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <IncomingCallDialog
        call={incomingCall}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
    </>
  );
};

export default Messages;
