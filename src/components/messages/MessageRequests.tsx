
import React from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { Message } from "@/types";

interface MessageRequestsProps {
  requests: Message[];
  onSelectRequest: (user: Message['sender']) => void;
  onAcceptRequest: (senderId: string) => void;
  onDeclineRequest: (senderId: string) => void;
  selectedSenderId?: string | null;
}

export function MessageRequests() {
  return (
    <div className="overflow-y-auto h-[calc(80vh-130px)]">
      <AnimatePresence>
        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
          <AlertCircle className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-center">Feature Removed</p>
          <p className="text-sm text-center mt-2">
            The messaging functionality has been removed from this application
          </p>
        </div>
      </AnimatePresence>
    </div>
  );
}
