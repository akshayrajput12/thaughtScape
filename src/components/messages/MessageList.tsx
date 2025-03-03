
import React from 'react';
import { ChatBubble } from '@/components/ui/chat-bubble';
import { MessageLoading } from '@/components/ui/message-loading';
import type { Message } from '@/types';

interface MessageListProps {
  isLoadingMessages: boolean;
  messagesToShow: Message[];
  currentUserId: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function MessageList({ 
  isLoadingMessages, 
  messagesToShow, 
  currentUserId,
  messagesEndRef
}: MessageListProps) {
  if (isLoadingMessages) {
    return <MessageLoading />;
  }

  if (messagesToShow.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p>No messages yet.</p>
        <p className="text-sm mt-2">Start the conversation by sending a message.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      {messagesToShow.map((message) => (
        <ChatBubble
          key={message.id}
          message={message.content}
          isOutgoing={message.sender_id === currentUserId}
          timestamp={new Date(message.created_at)}
          sender={message.sender?.username || "Unknown"}
          avatar={message.sender?.avatar_url}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
