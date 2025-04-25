
import { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Profile } from "@/types";

interface ChatInterfaceProps {
  currentUser: Profile;
  selectedUser: Profile;
  onBack?: () => void;
}

export const ChatInterface = ({ currentUser, selectedUser, onBack }: ChatInterfaceProps) => {
  const { toast } = useToast();
  
  useEffect(() => {
    toast({
      title: "Chat Feature Removed",
      description: "The chat functionality has been removed from this application.",
      variant: "destructive",
    });
  }, [toast]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-300 relative overflow-hidden">
              {selectedUser.avatar_url ? (
                <img src={selectedUser.avatar_url} alt={selectedUser.username} className="h-full w-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-primary text-white font-medium text-lg">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="ml-3">
              <div className="font-medium">{selectedUser.full_name || selectedUser.username}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500">Chat functionality has been removed from this application.</p>
        </div>
      </div>
    </div>
  );
};
