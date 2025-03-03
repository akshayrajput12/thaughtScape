
import React, { FormEvent, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertCircle, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Paperclip, Mic, CornerDownLeft, ArrowLeft, Phone, Video, Mail, UserCheck } from "lucide-react";
import { Message, Profile } from "@/types";
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/ui/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { ChatInput } from "@/components/ui/chat-input";
import { CallControls } from "@/components/messages/CallControls";

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
  if (!selectedUser) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a conversation to start messaging
      </div>
    );
  }

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

      {!isInCall && (
        <>
          {!followStatus[selectedUser.id] && messageCount >= 3 && (
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
            {!followStatus[selectedUser.id] && (
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
    </>
  );
}
