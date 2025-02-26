import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Search, Mail, Users, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CallControls } from "@/components/messages/CallControls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CallView } from '@/components/messages/CallView';
import { IncomingCallDialog } from '@/components/messages/IncomingCallDialog';
import { CallRequest, WebRTCConnection } from '@/utils/webrtc';

interface User {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  is_following?: boolean;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  sender: User;
  receiver: User;
}

interface Conversation {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

const Messages = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
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
  const callDurationInterval = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const rtcConnectionRef = useRef<WebRTCConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

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
    if (!currentUserId) return;

    const fetchConversations = async () => {
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

      const conversationsMap = new Map<string, Conversation>();

      data.forEach((message: Message) => {
        const otherUser = message.sender_id === currentUserId ? message.receiver : message.sender;
        const existingConv = conversationsMap.get(otherUser.id);

        if (!existingConv || new Date(message.created_at) > new Date(existingConv.lastMessage.created_at)) {
          conversationsMap.set(otherUser.id, {
            user: otherUser,
            lastMessage: message,
            unreadCount: message.receiver_id === currentUserId ? 1 : 0,
          });
        }
      });

      setConversations(Array.from(conversationsMap.values()));
    };

    fetchConversations();

    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new.sender_id === currentUserId || payload.new.receiver_id === currentUserId) {
            fetchConversations();
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

      setMessages(data);
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
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUserId, selectedUser]);

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
        }
      };
      fetchUser();
    }
  }, []);

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

  const sendMessage = async () => {
    if (!currentUserId || !selectedUser || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage.trim(),
          sender_id: currentUserId,
          receiver_id: selectedUser.id,
        });

      if (error) throw error;

      setNewMessage("");
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    } catch (error) {
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

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white to-primary/10 pt-20">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-3 min-h-[80vh]">
            <div className="border-r border-gray-200">
              <Tabs defaultValue="chats" className="w-full" onValueChange={setActiveTab}>
                <div className="p-4 border-b border-gray-200">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="chats" className="flex-1">
                      <Mail className="w-4 h-4 mr-2" />
                      Chats
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex-1">
                      <Users className="w-4 h-4 mr-2" />
                      Users
                    </TabsTrigger>
                  </TabsList>
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
                      {filteredConversations.map((conv) => (
                        <motion.div
                          key={conv.user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                            selectedUser?.id === conv.user.id ? 'bg-gray-50' : ''
                          }`}
                          onClick={() => setSelectedUser(conv.user)}
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

                <TabsContent value="users" className="m-0">
                  <div className="overflow-y-auto h-[calc(80vh-130px)]">
                    <AnimatePresence>
                      {searchResults.map((user) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setSelectedUser(user)}
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
                                {user.is_following ? 'Following' : ''}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(user);
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
              </Tabs>
            </div>

            <div className="col-span-2 flex flex-col">
              {selectedUser ? (
                <>
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedUser.avatar_url || undefined} />
                          <AvatarFallback>{selectedUser.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{selectedUser.full_name || selectedUser.username}</p>
                          {isInCall && (
                            <p className="text-sm text-gray-500">
                              {new Date(callDuration * 1000).toISOString().substr(11, 8)}
                            </p>
                          )}
                        </div>
                      </div>
                      <CallControls
                        isInCall={isInCall}
                        isVideo={isVideo}
                        isMuted={isMuted}
                        onToggleAudio={toggleAudio}
                        onToggleVideo={toggleVideo}
                        onStartCall={handleStartCall}
                        onEndCall={handleEndCall}
                      />
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
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          <AnimatePresence>
                            {messages.map((message) => (
                              <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[70%] p-3 rounded-lg ${
                                    message.sender_id === currentUserId
                                      ? 'bg-primary text-primary-foreground ml-auto'
                                      : 'bg-gray-100 text-gray-900'
                                  }`}
                                >
                                  <p>{message.content}</p>
                                  <p className="text-xs opacity-70 mt-1">
                                    {new Date(message.created_at).toLocaleTimeString()}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t border-gray-200">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Type a message..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                              className="flex-1"
                            />
                            <Button onClick={sendMessage}>
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
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
