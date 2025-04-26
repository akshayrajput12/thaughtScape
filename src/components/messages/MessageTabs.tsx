
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Mail, AlertCircle, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MessageTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  requestsCount: number;
  children?: React.ReactNode;
}

export function MessageTabs({ activeTab, onTabChange, requestsCount, children }: MessageTabsProps) {
  return (
    <Tabs 
      defaultValue={activeTab} 
      className="w-full" 
      onValueChange={onTabChange}
      value={activeTab}
    >
      <TabsList className="w-full mb-4">
        <TabsTrigger value="chats" className="flex-1">
          <Mail className="w-4 h-4 mr-2" />
          Chats
        </TabsTrigger>
        <TabsTrigger value="requests" className="flex-1 relative">
          <AlertCircle className="w-4 h-4 mr-2" />
          Requests
          {requestsCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0"
            >
              {requestsCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="users" className="flex-1">
          <UserCheck className="w-4 h-4 mr-2" />
          Users
        </TabsTrigger>
      </TabsList>
      
      {children}
    </Tabs>
  );
}
