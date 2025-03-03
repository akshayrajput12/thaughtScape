
import React from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { EmptyChat } from './EmptyChat';
import type { Profile, Message } from '@/types';

interface ChatAreaProps {
  selectedUser: Profile | null;
  isLoadingMessages: boolean;
  messagesToShow: Message[];
  messages: Message[];
  messageContent: string;
  setMessageContent: (content: string) => void;
  handleSendMessage: () => void;
  isFollowing: boolean;
  followStatus: Record<string, boolean>;
  currentUserId: string | null;
  handleFollow: (userId: string) => void;
  handleUnfollow: (userId: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  messageCountExceedsLimit?: boolean;
}

export function ChatArea({
  selectedUser,
  isLoadingMessages,
  messagesToShow,
  messages,
  messageContent,
  setMessageContent,
  handleSendMessage,
  isFollowing,
  followStatus,
  currentUserId,
  handleFollow,
  handleUnfollow,
  messagesEndRef,
  messageCountExceedsLimit = false
}: ChatAreaProps) {
  if (!selectedUser) {
    return <EmptyChat />;
  }

  return (
    <>
      <ChatHeader
        selectedUser={selectedUser}
        isFollowing={isFollowing}
        handleFollow={handleFollow}
        handleUnfollow={handleUnfollow}
      />
      
      <div className="flex-1 overflow-hidden flex flex-col h-full">
        <MessageList
          isLoadingMessages={isLoadingMessages}
          messagesToShow={messagesToShow}
          currentUserId={currentUserId}
          messagesEndRef={messagesEndRef}
        />
        
        <MessageInput
          messageContent={messageContent}
          setMessageContent={setMessageContent}
          handleSendMessage={handleSendMessage}
          disabled={messageCountExceedsLimit}
          disabledMessage={
            messageCountExceedsLimit 
              ? "You can send only 3 messages to users who don't follow you" 
              : undefined
          }
        />
      </div>
    </>
  );
}
