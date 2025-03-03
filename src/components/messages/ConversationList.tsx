
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
  const filteredConversations = conversations.filter(conv =>
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="overflow-y-auto h-[calc(80vh-130px)]">
      <AnimatePresence>
        {filteredConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <Mail className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-center">No conversations yet</p>
            <p className="text-sm text-center mt-2">
              Start a new conversation by searching for users
            </p>
          </div>
        )}
        
        {filteredConversations.map((conv) => (
          <motion.div
            key={conv.user.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
              selectedUser?.id === conv.user.id ? 'bg-gray-50' : ''
            }`}
            onClick={() => onSelectUser(conv.user)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={conv.user.avatar_url || undefined} />
                <AvatarFallback>{conv.user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {conv.user.full_name || conv.user.username}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {conv.lastMessage.content}
                </p>
              </div>
              {conv.unreadCount > 0 && (
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs text-white">{conv.unreadCount}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
