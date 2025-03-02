
import { useState, useEffect, useRef, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Send, Search, Mail, Users, UserPlus, Paperclip, Mic, CornerDownLeft, 
  ArrowLeft, Phone, Video, AlertCircle, Ban, UserCheck 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CallControls } from "@/components/messages/CallControls";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CallView } from '@/components/messages/CallView';
import { IncomingCallDialog } from '@/components/messages/IncomingCallDialog';
import { CallRequest, WebRTCConnection } from '@/utils/webrtc';
import { 
  ChatBubble, 
  ChatBubbleAvatar, 
  ChatBubbleMessage 
} from "@/components/ui/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { ChatInput } from "@/components/ui/chat-input";
import { MessageTabs } from "@/components/messages/MessageTabs";
import { MessageRequests } from "@/components/messages/MessageRequests";
import { Message, User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Conversation {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

const Messages = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messageRequests, setMessageRequests] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
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

  // Fetch user follows data
  useEffect(() => {
    if (!currentUserId) return;

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
      // First, get all messages
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

      // Get follows to determine which messages are requests
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId);

      if (followsError) {
        console.error('Error fetching follows:', followsError);
        return;
      }

      // Create a map of user IDs that the current user follows
      const followingMap = new Set(followsData.map(f => f.following_id));

      // Separate messages into conversations and requests
      const conversationsMap = new Map<string, Conversation>();
      const requestsArray: Message[] = [];

      data.forEach((message: Message) => {
        const isOutgoing = message.sender_id === currentUserId;
        const otherUser = isOutgoing ? message.receiver : message.sender;
        
        if (!otherUser) return;

        const otherUserId = otherUser.id;
        
        // Determine if this is a request or a conversation
        // Requests are incoming messages where the receiver (current user) doesn't follow the sender
        if (
          !isOutgoing && 
          !followingMap.has(message.sender_id) && 
          (message.request_status === 'pending' || message.request_status === null)
        ) {
          requestsArray.push(message);
          return;
        }

        // For regular conversations
        const existingConv = conversationsMap.get(otherUserId);

        if (!existingConv || new Date(message.created_at) > new Date(existingConv.lastMessage.created_at)) {
          conversationsMap.set(otherUserId, {
            user: otherUser,
            lastMessage: message,
            unreadCount: !isOutgoing && !message.is_read ? 1 : 0,
          });
        } else if (!isOutgoing && !message.is_read) {
          // Increment unread count for existing conversation
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
      // Check if the user follows the selected user
      const isFollowing = followStatus[selectedUser.id] || false;

      // Get all messages between the users
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

      // Filter messages based on request status
      let filteredMessages = data;
      
      // If in chat tab, only show accepted requests or messages where receiver follows sender
      if (activeTab === 'chats') {
        filteredMessages = data.filter(msg => 
          msg.request_status === 'accepted' || 
          // Outgoing messages
          msg.sender_id === currentUserId ||
          // The current user follows the sender
          isFollowing
        );
      }

      setMessages(filteredMessages);
      
      // Count messages from the selected user to the current user
      const incomingMessageCount = data.filter(
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

      setSearchResults(data);
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
      // Update all messages from this sender to be accepted
      const { error } = await supabase
        .from('messages')
        .update({ request_status: 'accepted' })
        .eq('sender_id', senderId)
        .eq('receiver_id', currentUserId)
        .eq('request_status', 'pending');

      if (error) throw error;

      // Fetch the sender's profile
      const { data: senderData, error: senderError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', senderId)
        .single();

      if (senderError) throw senderError;

      // Set the selected user to the sender
      setSelectedUser(senderData);
      
      // Switch to chats tab
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
      // Update all messages from this sender to be declined
      const { error } = await supabase
        .from('messages')
        .update({ request_status: 'declined' })
        .eq('sender_id', senderId)
        .eq('receiver_id', currentUserId)
        .eq('request_status', 'pending');

      if (error) throw error;

      // Remove from selected user if currently selected
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

    // Check if this is a request message (receiver doesn't follow sender)
    const isRequest = !followStatus[selectedUser.id];
    
    // If this is a request, check if sender has already sent 3 messages
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

      // Update the message count if this is a request
      if (isRequest) {
        setMessageCount(prev => prev + 1);
      }

      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? { 
          ...data,
          sender: optimisticMessage.sender,
          receiver: optimisticMessage.receiver
        } : msg
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

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    if (isMobileView) {
      setShowConversations(false);
    }
  };

  // Calculate requests count for badge
  const requestsCount = messageRequests.reduce((acc, msg) => {
    // Count unique senders
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
                <div className="p-4 border-b border-gray-200">
                  <MessageTabs 
                    activeTab={activeTab} 
                    onTabChange={setActiveTab} 
                    requestsCount={requestsCount} 
                  />
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder={activeTab === "chats" ? "Search conversations..." : "Search users..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <TabsContent value="chats" className="m-0">
                  <div className="overflow-y-auto h-[calc(80vh-130px)]">
                    <AnimatePresence>
                      {filteredConversations.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                          <Mail className="h-16 w-16 text-gray-300 mb-4" />
                          <p className="text-center">No conversations yet</p>
                          <p className="text-sm text-center mt-2">
                            Start a new conversation by searching for users
                          </p>
                        </div>
                      )}
                      
                      {filteredConversations.map((conv) => (
                        <motion.div
                          key={conv.user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                            selectedUser?.id === conv.user.id ? 'bg-gray-50' : ''
                          }`}
                          onClick={() => handleSelectUser(conv.user)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={conv.user.avatar_url || undefined} />
                              <AvatarFallback>{conv.user.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {conv.user.full_name || conv.user.username}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {conv.lastMessage.content}
                              </p>
                            </div>
                            {conv.unreadCount > 0 && (
                              <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-xs text-white">{conv.unreadCount}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </TabsContent>

                <TabsContent value="requests" className="m-0">
                  <MessageRequests
                    requests={messageRequests}
                    onSelectRequest={handleSelectUser}
                    onAcceptRequest={handleAcceptRequest}
                    onDeclineRequest={handleDeclineRequest}
                    selectedSenderId={selectedUser?.id}
                  />
                </TabsContent>

                <TabsContent value="users" className="m-0">
                  <div className="overflow-y-auto h-[calc(80vh-130px)]">
                    <AnimatePresence>
                      {searchResults.length === 0 && searchQuery && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                          <Users className="h-16 w-16 text-gray-300 mb-4" />
                          <p className="text-center">No users found</p>
                          <p className="text-sm text-center mt-2">
                            Try a different search term
                          </p>
                        </div>
                      )}
                      
                      {searchResults.length === 0 && !searchQuery && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                          <Search className="h-16 w-16 text-gray-300 mb-4" />
                          <p className="text-center">Search for users</p>
                          <p className="text-sm text-center mt-2">
                            Find people to connect with
                          </p>
                        </div>
                      )}
                      
                      {searchResults.map((user) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleSelectUser(user)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {user.full_name || user.username}
                              </p>
                              <p className="text-sm text-gray-500">
                                {user.is_following ? (
                                  <span className="flex items-center text-green-600">
                                    <UserCheck className="h-3 w-3 mr-1" /> Following
                                  </span>
                                ) : ''}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectUser(user);
                              }}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </TabsContent>
              </div>
            )}

            {(!isMobileView || !showConversations) && (
              <div className="md:col-span-2 flex flex-col">
                {selectedUser ? (
                  <>
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isMobileView && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={handleBackToList}
                              className="mr-1"
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                          )}
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={selectedUser.avatar_url || undefined} />
                            <AvatarFallback>{selectedUser.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{selectedUser.full_name || selectedUser.username}</p>
                            {followStatus[selectedUser.id] ? (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                <UserCheck className="h-3 w-3 mr-1" /> Following
                              </Badge>
                            ) : (
                              !isInCall && activeTab === 'chats' && (
                                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                  Not following
                                </Badge>
                              )
                            )}
                            {isInCall && (
                              <p className="text-sm text-gray-500">
                                {new Date(callDuration * 1000).toISOString().substr(11, 8)}
                              </p>
                            )}
                          </div>
                        </div>
                        {!isInCall && (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => handleStartCall(false)}
                              className="rounded-full"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => handleStartCall(true)}
                              className="rounded-full"
                            >
                              <Video className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {isInCall && (
                          <CallControls
                            isInCall={isInCall}
                            isVideo={isVideo}
                            isMuted={isMuted}
                            onToggleAudio={toggleAudio}
                            onToggleVideo={toggleVideo}
                            onStartCall={handleStartCall}
                            onEndCall={handleEndCall}
                          />
                        )}
                      </div>
                    </div>

                    <div className="relative flex-1 overflow-hidden">
                      {isInCall ? (
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
                        <>
                          {/* Request status alert */}
                          {!followStatus[selectedUser.id] && activeTab === 'chats' && messageCount >= 3 && (
                            <Alert className="m-4 bg-yellow-50 border-yellow-100">
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                              <AlertTitle className="text-yellow-700">Message limit reached</AlertTitle>
                              <AlertDescription className="text-yellow-600">
                                You've sent {messageCount} messages. You can send up to 3 messages until {selectedUser.username} accepts your request.
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="flex-1 h-[calc(80vh-190px)]">
                            <ChatMessageList>
                              {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                  <Mail className="h-16 w-16 text-gray-300 mb-4" />
                                  <p className="text-center">No messages yet</p>
                                  <p className="text-sm text-center mt-2">
                                    Start a conversation with {selectedUser.username}
                                  </p>
                                </div>
                              )}
                              
                              {messages.map((message) => (
                                <ChatBubble
                                  key={message.id}
                                  variant={message.sender_id === currentUserId ? "sent" : "received"}
                                >
                                  <ChatBubbleAvatar
                                    className="h-8 w-8 shrink-0"
                                    src={message.sender?.avatar_url || undefined}
                                    fallback={(message.sender?.username?.[0] || '?').toUpperCase()}
                                  />
                                  <ChatBubbleMessage
                                    variant={message.sender_id === currentUserId ? "sent" : "received"}
                                  >
                                    {message.content}
                                  </ChatBubbleMessage>
                                </ChatBubble>
                              ))}
                              <div ref={messagesEndRef} />
                            </ChatMessageList>
                          </div>
                          <div className="p-4 border-t border-gray-200">
                            {/* Show message restrictions notice */}
                            {!followStatus[selectedUser.id] && activeTab === 'chats' && (
                              <div className="mb-2 px-3 py-2 bg-yellow-50 rounded-md text-sm text-yellow-800 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span>
                                  You can send {3 - messageCount} more {3 - messageCount === 1 ? 'message' : 'messages'} until {selectedUser.username} accepts your request
                                </span>
                              </div>
                            )}
                            
                            <form
                              onSubmit={sendMessage}
                              className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
                            >
                              <ChatInput
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={isListening ? "Listening..." : "Type your message..."}
                                className={`min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0 ${isListening ? 'bg-primary/10' : ''}`}
                                onEnterSubmit={sendMessage}
                                disabled={!followStatus[selectedUser.id] && messageCount >= 3}
                              />
                              <div className="flex items-center p-3 pt-0 justify-between">
                                <div className="flex">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    type="button"
                                    disabled={!followStatus[selectedUser.id] && messageCount >= 3}
                                  >
                                    <Paperclip className="size-4" />
                                  </Button>

                                  <Button
                                    variant={isListening ? "secondary" : "ghost"}
                                    size="icon"
                                    type="button"
                                    onClick={toggleSpeechRecognition}
                                    className={isListening ? "bg-primary/20" : ""}
                                    disabled={!followStatus[selectedUser.id] && messageCount >= 3}
                                  >
                                    <Mic className={`size-4 ${isListening ? "text-primary animate-pulse" : ""}`} />
                                  </Button>
                                </div>
                                <Button 
                                  type="submit" 
                                  size="sm" 
                                  className="ml-auto gap-1.5"
                                  disabled={!newMessage.trim() || (!followStatus[selectedUser.id] && messageCount >= 3)}
                                >
                                  Send Message
                                  <CornerDownLeft className="size-3.5" />
                                </Button>
                              </div>
                            </form>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Select a conversation to start messaging
                  </div>
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
