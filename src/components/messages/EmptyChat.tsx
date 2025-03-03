
import React from 'react';
import { MessageSquare } from 'lucide-react';

export function EmptyChat() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
      <p className="text-lg font-medium">Select a conversation</p>
      <p className="text-sm mt-2">Choose from your existing conversations or start a new one</p>
    </div>
  );
}
