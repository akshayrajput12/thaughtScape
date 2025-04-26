
import React from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { ConversationList } from './ConversationList';
import { MessageRequests } from './MessageRequests';
import { UserSearch } from './UserSearch';
import { Message, Profile } from "@/types";

interface Conversation {
  user: Profile;
  lastMessage: Message;
  unreadCount: number;
}

interface SidebarContentProps {
  activeTab: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  conversations: Conversation[];
  messageRequests: Message[];
  searchResults: Profile[];
  selectedUser: Profile | null;
  onSelectUser: (user: Profile) => void;
  onAcceptRequest: (senderId: string) => void;
  onDeclineRequest: (senderId: string) => void;
}

export function SidebarContent({
  activeTab,
  searchQuery,
  setSearchQuery,
  conversations = [],
  selectedUser,
  onSelectUser,
  searchResults = []
}: SidebarContentProps) {
  return (
    <>
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={activeTab === "chats" ? "Search conversations..." : "Search users..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <TabsContent value="chats" className="m-0">
        <ConversationList
          conversations={conversations}
          searchQuery={searchQuery}
          selectedUser={selectedUser}
          onSelectUser={onSelectUser}
        />
      </TabsContent>

      <TabsContent value="requests" className="m-0">
        <MessageRequests />
      </TabsContent>

      <TabsContent value="users" className="m-0">
        <UserSearch
          searchResults={searchResults}
          searchQuery={searchQuery}
          onSelectUser={onSelectUser}
        />
      </TabsContent>
    </>
  );
}
