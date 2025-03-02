
import React from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Message } from "@/types";

interface MessageRequestsProps {
  requests: Message[];
  onSelectRequest: (user: Message['sender']) => void;
  onAcceptRequest: (senderId: string) => void;
  onDeclineRequest: (senderId: string) => void;
  selectedSenderId?: string | null;
}

export function MessageRequests({ 
  requests, 
  onSelectRequest, 
  onAcceptRequest, 
  onDeclineRequest,
  selectedSenderId
}: MessageRequestsProps) {
  // Group requests by sender
  const requestsBySender = requests.reduce((acc, request) => {
    if (!request.sender) return acc;
    
    if (!acc[request.sender.id]) {
      acc[request.sender.id] = {
        sender: request.sender,
        messages: []
      };
    }
    
    acc[request.sender.id].messages.push(request);
    return acc;
  }, {} as Record<string, { sender: NonNullable<Message['sender']>, messages: Message[] }>);

  return (
    <div className="overflow-y-auto h-[calc(80vh-130px)]">
      <AnimatePresence>
        {Object.values(requestsBySender).length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <AlertCircle className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-center">You don't have any message requests</p>
          </div>
        )}
        
        {Object.values(requestsBySender).map(({ sender, messages }) => (
          <motion.div
            key={sender.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 ${
              selectedSenderId === sender.id ? 'bg-gray-50' : ''
            }`}
            onClick={() => onSelectRequest(sender)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={sender.avatar_url || undefined} />
                <AvatarFallback>{sender.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {sender.full_name || sender.username}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full text-green-500 hover:text-green-600 hover:bg-green-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAcceptRequest(sender.id);
                  }}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeclineRequest(sender.id);
                  }}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
