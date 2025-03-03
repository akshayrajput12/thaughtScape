
import React from 'react';
import { Send } from 'lucide-react';
import { ChatInput } from '@/components/ui/chat-input';
import { Button } from '@/components/ui/button';

interface MessageInputProps {
  messageContent: string;
  setMessageContent: (content: string) => void;
  handleSendMessage: () => void;
  disabled?: boolean;
  disabledMessage?: string;
}

export function MessageInput({ 
  messageContent, 
  setMessageContent, 
  handleSendMessage,
  disabled = false,
  disabledMessage
}: MessageInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 relative">
      {disabled && disabledMessage && (
        <div className="absolute inset-x-0 -top-10 bg-red-50 text-red-600 p-2 text-center text-sm">
          {disabledMessage}
        </div>
      )}
      <div className="flex items-center space-x-2">
        <ChatInput
          placeholder="Type a message..."
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          onClick={handleSendMessage}
          disabled={messageContent.trim().length === 0 || disabled}
          className="rounded-full h-10 w-10 p-0 flex items-center justify-center"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
