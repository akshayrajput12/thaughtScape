
import React from 'react';
import { MessageTabs } from './MessageTabs';
import { SidebarContent } from './SidebarContent';
import { ChatArea } from './ChatArea';
import { Profile, Message } from "@/types";

interface Conversation {
  user: Profile;
  lastMessage: Message;
  unreadCount: number;
}

interface MessageLayoutProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  requestsCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  conversations: Conversation[];
  messageRequests: Message[];
  searchResults: Profile[];
  selectedUser: Profile | null;
  onSelectUser: (user: Profile) => void;
  onAcceptRequest: (senderId: string) => void;
  onDeclineRequest: (senderId: string) => void;
  messagesToShow: Message[];
  isLoadingMessages: boolean;
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
}

export function MessageLayout({
  activeTab,
  onTabChange,
  requestsCount,
  searchQuery,
  setSearchQuery,
  conversations,
  messageRequests,
  searchResults,
  selectedUser,
  onSelectUser,
  onAcceptRequest,
  onDeclineRequest,
  messagesToShow,
  isLoadingMessages,
  messages,
  messageContent,
  setMessageContent,
  handleSendMessage,
  isFollowing,
  followStatus,
  currentUserId,
  handleFollow,
  handleUnfollow,
  messagesEndRef
}: MessageLayoutProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-[85vh] gap-0 md:gap-4 bg-white rounded-lg shadow-md overflow-hidden">
      {/* Left sidebar */}
      <div className="md:col-span-1 border-r border-gray-200 overflow-hidden h-full flex flex-col">
        <MessageTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
          requestsCount={requestsCount}
        >
          <SidebarContent
            activeTab={activeTab}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            conversations={conversations}
            messageRequests={messageRequests}
            searchResults={searchResults}
            selectedUser={selectedUser}
            onSelectUser={onSelectUser}
            onAcceptRequest={onAcceptRequest}
            onDeclineRequest={onDeclineRequest}
          />
        </MessageTabs>
      </div>

      {/* Right content area */}
      <div className="md:col-span-2 lg:col-span-3 flex flex-col h-full">
        <ChatArea
          selectedUser={selectedUser}
          isLoadingMessages={isLoadingMessages}
          messagesToShow={messagesToShow}
          messages={messages}
          messageContent={messageContent}
          setMessageContent={setMessageContent}
          handleSendMessage={handleSendMessage}
          isFollowing={isFollowing}
          followStatus={followStatus}
          currentUserId={currentUserId}
          handleFollow={handleFollow}
          handleUnfollow={handleUnfollow}
          messagesEndRef={messagesEndRef}
        />
      </div>
    </div>
  );
}
