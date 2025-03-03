
import React from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Users, UserCheck, UserPlus } from "lucide-react";
import { Profile } from "@/types";

interface UserSearchProps {
  searchResults: Profile[];
  searchQuery: string;
  onSelectUser: (user: Profile) => void;
}

export function UserSearch({ searchResults, searchQuery, onSelectUser }: UserSearchProps) {
  return (
    <div className="overflow-y-auto h-[calc(80vh-130px)]">
      <AnimatePresence>
        {searchResults.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <Users className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-center">No users found</p>
            <p className="text-sm text-center mt-2">
              Try a different search term
            </p>
          </div>
        )}
        
        {searchResults.length === 0 && !searchQuery && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <Search className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-center">Search for users</p>
            <p className="text-sm text-center mt-2">
              Find people to connect with
            </p>
          </div>
        )}
        
        {searchResults.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onSelectUser(user)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {user.full_name || user.username}
                </p>
                <p className="text-sm text-gray-500">
                  {user.is_following ? (
                    <span className="flex items-center text-green-600">
                      <UserCheck className="h-3 w-3 mr-1" /> Following
                    </span>
                  ) : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectUser(user);
                }}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
