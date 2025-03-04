
import React, { FormEvent, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Paperclip, Mic, CornerDownLeft, ArrowLeft, Phone, Video, Mail, UserCheck, AlertCircle, Shield, ShieldAlert } from "lucide-react";
import { Message, Profile } from "@/types";
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/ui/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { ChatInput } from "@/components/ui/chat-input";
import { CallControls } from "@/components/messages/CallControls";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { isUserBlocked, blockUser, isBlockedBy } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ChatAreaProps {
  selectedUser: Profile | null;
  currentUserId: string;
  messages: Message[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  followStatus: {[key: string]: boolean};
  messageCount: number;
  isInCall: boolean;
  isVideo: boolean;
  isMuted: boolean;
  callDuration: number;
  isListening: boolean;
  isMobileView: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  handleBackToList: () => void;
  handleStartCall: (withVideo: boolean) => void;
  handleEndCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleSpeechRecognition: () => void;
  sendMessage: (e?: FormEvent) => void;
}

export function ChatArea({
  selectedUser,
  currentUserId,
  messages,
  newMessage,
  setNewMessage,
  followStatus,
  messageCount,
  isInCall,
  isVideo,
  isMuted,
  callDuration,
  isListening,
  isMobileView,
  messagesEndRef,
  handleBackToList,
  handleStartCall,
  handleEndCall,
  toggleAudio,
  toggleVideo,
  toggleSpeechRecognition,
  sendMessage
}: ChatAreaProps) {
  const [isBlocked, setIsBlocked] = React.useState(false);
  const [isBlockedBy, setIsBlockedBy] = React.useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!selectedUser) return;
      
      const blocked = await isUserBlocked(selectedUser.id);
      setIsBlocked(blocked);
      
      const blockedByResult = await isBlockedBy(selectedUser.id);
      setIsBlockedBy(blockedByResult);
    };
    
    if (selectedUser) {
      checkBlockStatus();
    }
  }, [selectedUser]);

  const handleNavigateToProfile = () => {
    if (selectedUser) {
      navigate(`/profile/${selectedUser.id}`);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedUser) return;
    
    try {
      const result = await blockUser(selectedUser.id);
      
      if (!result.success) throw new Error(result.error);
      
      setIsBlocked(true);
      
      toast({
        title: "User Blocked",
        description: `You have blocked ${selectedUser.username}`,
      });
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({
        title: "Error",
        description: "Failed to block user",
        variant: "destructive",
      });
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a conversation to start messaging
      </div>
    );
  }

  // Check if message limit has been reached and request is pending
  const messageLimitReached = !followStatus[selectedUser.id] && messageCount >= 3;
  const isBlocking = isBlocked || isBlockedBy;

  return (
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
            <div onClick={handleNavigateToProfile} className="flex items-center gap-3 cursor-pointer">
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
                  !isInCall && (
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
          </div>
          <div className="flex gap-2">
            {!isInCall && !isBlocking && (
              <>
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline"
                      size="icon"
                      className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <ShieldAlert className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Block {selectedUser.username}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Blocking this user will prevent them from sending you messages or seeing your content.
                        They will not be notified that you've blocked them.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleBlockUser}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Block User
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
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
      </div>

      {!isInCall && (
        <>
          {isBlocked && (
            <Alert className="m-4 bg-red-50 border-red-100">
              <Shield className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-700">User blocked</AlertTitle>
              <AlertDescription className="text-red-600">
                You've blocked this user. You won't receive messages from them.
              </AlertDescription>
            </Alert>
          )}
          
          {isBlockedBy && (
            <Alert className="m-4 bg-red-50 border-red-100">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-700">Cannot send messages</AlertTitle>
              <AlertDescription className="text-red-600">
                You cannot send messages to this user because they have blocked you.
              </AlertDescription>
            </Alert>
          )}

          {messageLimitReached && !isBlocking && (
            <Alert className="m-4 bg-yellow-50 border-yellow-100">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-700">Message limit reached</AlertTitle>
              <AlertDescription className="text-yellow-600">
                You've sent {messageCount} messages. You can't send more messages until {selectedUser.username} accepts your request.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex-1 h-[calc(80vh-190px)]">
            <ScrollArea className="h-full">
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
                      className="h-8 w-8 shrink-0 cursor-pointer"
                      src={message.sender?.avatar_url || undefined}
                      fallback={(message.sender?.username?.[0] || '?').toUpperCase()}
                      onClick={() => navigate(`/profile/${message.sender_id}`)}
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
            </ScrollArea>
          </div>
          <div className="p-4 border-t border-gray-200">
            {!followStatus[selectedUser.id] && messageCount > 0 && !messageLimitReached && !isBlocking && (
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
                placeholder={isListening ? "Listening..." : messageLimitReached || isBlocking ? "Cannot send messages" : "Type your message..."}
                className={`min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0 ${isListening ? 'bg-primary/10' : ''}`}
                onEnterSubmit={sendMessage}
                disabled={messageLimitReached || isBlocking}
              />
              <div className="flex items-center p-3 pt-0 justify-between">
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    disabled={messageLimitReached || isBlocking}
                  >
                    <Paperclip className="size-4" />
                  </Button>

                  <Button
                    variant={isListening ? "secondary" : "ghost"}
                    size="icon"
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={isListening ? "bg-primary/20" : ""}
                    disabled={messageLimitReached || isBlocking}
                  >
                    <Mic className={`size-4 ${isListening ? "text-primary animate-pulse" : ""}`} />
                  </Button>
                </div>
                <Button 
                  type="submit" 
                  size="sm" 
                  className="ml-auto gap-1.5"
                  disabled={!newMessage.trim() || messageLimitReached || isBlocking}
                >
                  Send Message
                  <CornerDownLeft className="size-3.5" />
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}
