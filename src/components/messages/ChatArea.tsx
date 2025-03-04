
import { Dispatch, RefObject, SetStateAction, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { ChatBubble } from "@/components/ui/chat-bubble";
import { MessageLoading } from "@/components/ui/message-loading";
import { ArrowLeftIcon, Mic, Video, Phone, UserX, Shield, UserCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Message, Profile } from "@/types";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ChatAreaProps {
  selectedUser: Profile | null;
  currentUserId: string;
  messages: Message[];
  newMessage: string;
  setNewMessage: Dispatch<SetStateAction<string>>;
  followStatus: { [key: string]: boolean };
  messageCount: number;
  isInCall: boolean;
  isVideo: boolean;
  isMuted: boolean;
  callDuration: number;
  isListening: boolean;
  isMobileView: boolean;
  messagesEndRef: RefObject<HTMLDivElement>;
  handleBackToList: () => void;
  handleStartCall: (withVideo: boolean) => Promise<void>;
  handleEndCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleSpeechRecognition: () => void;
  sendMessage: (e?: FormEvent) => Promise<void>;
  viewUserProfile: (userId: string) => void;
  isUserBlocked: boolean;
  isBlockedBy: boolean;
  onBlockUser: () => Promise<void>;
  onUnblockUser: () => Promise<void>;
}

export const ChatArea = ({
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
  sendMessage,
  viewUserProfile,
  isUserBlocked,
  isBlockedBy,
  onBlockUser,
  onUnblockUser
}: ChatAreaProps) => {
  if (!selectedUser) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 p-5 text-center">
        <div>
          <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
          <p>Choose from your existing conversations or start a new one.</p>
        </div>
      </div>
    );
  }

  const isFollowing = followStatus[selectedUser.id] || false;
  const canSendMessage = isFollowing || !isUserBlocked && !isBlockedBy && (messageCount < 3 || messages.some(msg => msg.request_status === 'accepted'));
  const messageLimit = messageCount >= 3 && !isFollowing && !messages.some(msg => msg.request_status === 'accepted');
  
  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200 p-3 flex items-center">
        {isMobileView && (
          <Button
            onClick={handleBackToList}
            variant="ghost"
            size="icon"
            className="mr-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
        )}
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => viewUserProfile(selectedUser.id)}
        >
          <Avatar
            className="h-10 w-10 mr-3"
            src={selectedUser.avatar_url || ''}
            fallback={selectedUser.username?.[0]?.toUpperCase() || 'U'}
          />
          <div>
            <div className="font-semibold">{selectedUser.username}</div>
            <div className="text-xs text-gray-500">
              {isInCall
                ? `Call duration: ${Math.floor(callDuration / 60)}:${String(
                    callDuration % 60
                  ).padStart(2, "0")}`
                : 'Click to view profile'}
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center space-x-1">
          {!isInCall && (
            <>
              <Button
                onClick={() => handleStartCall(false)}
                variant="ghost"
                size="icon"
                className="rounded-full"
                disabled={isUserBlocked || isBlockedBy}
              >
                <Phone className="h-5 w-5" />
              </Button>
              <Button
                onClick={() => handleStartCall(true)}
                variant="ghost"
                size="icon"
                className="rounded-full"
                disabled={isUserBlocked || isBlockedBy}
              >
                <Video className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-more-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => viewUserProfile(selectedUser.id)}>
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isUserBlocked ? (
                    <DropdownMenuItem onClick={onUnblockUser}>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Unblock User
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={onBlockUser}>
                      <UserX className="mr-2 h-4 w-4" />
                      Block User
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {isBlockedBy && (
          <div className="bg-yellow-50 p-3 mb-4 rounded-lg border border-yellow-200 flex items-center">
            <Shield className="text-yellow-500 mr-2 h-5 w-5" />
            <span className="text-sm">You have been blocked by this user and cannot exchange messages.</span>
          </div>
        )}
        
        {isUserBlocked && (
          <div className="bg-gray-50 p-3 mb-4 rounded-lg border border-gray-200 flex items-center">
            <UserX className="text-gray-500 mr-2 h-5 w-5" />
            <span className="text-sm">You have blocked this user. <Button variant="link" className="p-0 h-auto" onClick={onUnblockUser}>Unblock</Button> to continue messaging.</span>
          </div>
        )}
        
        {!isFollowing && !messages.some(msg => msg.request_status === 'accepted') && !isUserBlocked && !isBlockedBy && (
          <div className="bg-blue-50 p-3 mb-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              {messageCount >= 3 
                ? "You've reached the maximum number of pending messages. Wait for this user to accept your request." 
                : `You can send ${3 - messageCount} more message(s) before ${selectedUser.username} accepts your request.`}
            </p>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.sender_id === currentUserId;
            const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
            const time = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });

            return (
              <ChatBubble
                key={message.id}
                message={message.content}
                sender={isCurrentUser ? 'user' : 'other'}
                time={time}
                showAvatar={showAvatar}
                avatar={
                  !isCurrentUser && showAvatar ? (
                    <Avatar
                      className="h-8 w-8"
                      src={message.sender?.avatar_url || ''}
                      fallback={(message.sender?.username?.[0] || 'U').toUpperCase()}
                      onClick={() => viewUserProfile(message.sender_id)}
                    />
                  ) : undefined
                }
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-200">
        <form onSubmit={sendMessage} className="flex items-center space-x-2">
          <Input
            placeholder={
              isUserBlocked
                ? "You've blocked this user"
                : isBlockedBy
                ? "You've been blocked by this user"
                : messageLimit
                ? "Message limit reached"
                : "Type a message..."
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!canSendMessage || isInCall}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleSpeechRecognition}
            disabled={!canSendMessage || isInCall}
            className={isListening ? "text-primary" : ""}
          >
            <Mic className="h-5 w-5" />
          </Button>
          <Button
            type="submit"
            disabled={!newMessage.trim() || !canSendMessage || isInCall}
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};
