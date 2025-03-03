
import React from 'react';
import { ChatBubble, ChatBubbleMessage, ChatBubbleAvatar } from '@/components/ui/chat-bubble';
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
          variant={message.sender_id === currentUserId ? "sent" : "received"}
        >
          <ChatBubbleAvatar 
            src={message.sender?.avatar_url} 
            fallback={message.sender?.username?.[0] || "U"} 
          />
          <ChatBubbleMessage variant={message.sender_id === currentUserId ? "sent" : "received"}>
            <div>
              <p className="text-xs text-gray-500 mb-1">{message.sender?.username || "Unknown"}</p>
              <p>{message.content}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </ChatBubbleMessage>
        </ChatBubble>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
