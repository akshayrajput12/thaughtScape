
import React from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail } from "lucide-react";
import { Message, Profile } from "@/types";

interface Conversation {
  user: Profile;
  lastMessage: Message;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  searchQuery: string;
  selectedUser: Profile | null;
  onSelectUser: (user: Profile) => void;
}

export function ConversationList({ 
  conversations, 
  searchQuery,
  selectedUser, 
  onSelectUser 
}: ConversationListProps) {
  return (
    <div className="overflow-y-auto h-[calc(80vh-130px)]">
      <AnimatePresence>
        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
          <Mail className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-center">Feature Removed</p>
          <p className="text-sm text-center mt-2">
            The messaging functionality has been removed from this application
          </p>
        </div>
      </AnimatePresence>
    </div>
  );
}
