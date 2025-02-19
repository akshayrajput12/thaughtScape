import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CallControls } from "@/components/messages/CallControls";

interface User {
  id: string;
  username: string;
  avatar_url?: string;
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
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isInCall, setIsInCall] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

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
          sender:profiles!messages_sender_id_fkey(id, username, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, username, avatar_url)
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
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId || !selectedUser) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, username, avatar_url)
        `)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data);
    };

    fetchMessages();
  }, [currentUserId, selectedUser]);

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

  const handleStartCall = async (withVideo: boolean) => {
    if (!selectedUser) return;
    
    setIsVideo(withVideo);
    setIsInCall(true);
    setIsMuted(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: withVideo,
        audio: true
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      toast({
        title: "Call Started",
        description: `${withVideo ? "Video" : "Audio"} call started with ${selectedUser.username}`,
      });
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        title: "Error",
        description: "Could not access camera/microphone",
        variant: "destructive",
      });
      setIsInCall(false);
    }
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setIsVideo(false);
    setIsMuted(false);

    if (localVideoRef.current?.srcObject) {
      const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }

    toast({
      title: "Call Ended",
      description: "The call has been ended",
    });
  };

  const toggleAudio = () => {
    setIsMuted(!isMuted);
    if (localVideoRef.current?.srcObject) {
      const audioTrack = (localVideoRef.current.srcObject as MediaStream)
        .getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
      }
    }
  };

  const toggleVideo = () => {
    setIsVideo(!isVideo);
    if (localVideoRef.current?.srcObject) {
      const videoTrack = (localVideoRef.current.srcObject as MediaStream)
        .getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideo;
      }
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-primary/10 pt-20">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="grid grid-cols-3 min-h-[80vh]">
          <div className="border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="overflow-y-auto h-[calc(80vh-73px)]">
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
                        <p className="font-medium truncate">{conv.user.username}</p>
                        <p className="text-sm text-gray-500 truncate">{conv.lastMessage.content}</p>
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
                        <p className="font-medium">{selectedUser.username}</p>
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
                  {isInCall && (
                    <div className="absolute inset-0 bg-gray-900">
                      <video
                        ref={remoteVideoRef}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                      />
                      {isVideo && (
                        <video
                          ref={localVideoRef}
                          className="absolute bottom-4 right-4 w-48 h-36 rounded-lg object-cover"
                          autoPlay
                          playsInline
                          muted
                        />
                      )}
                    </div>
                  )}

                  <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isInCall ? 'hidden' : ''}`}>
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
                                ? 'bg-primary text-primary-foreground'
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
                  </div>

                  {!isInCall && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <Button onClick={sendMessage}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
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
  );
};

export default Messages;
