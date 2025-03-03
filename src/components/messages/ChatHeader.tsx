
import React from 'react';
import { UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import type { Profile } from '@/types';

interface ChatHeaderProps {
  selectedUser: Profile | null;
  isFollowing: boolean;
  handleFollow: (userId: string) => void;
  handleUnfollow: (userId: string) => void;
}

export function ChatHeader({ 
  selectedUser, 
  isFollowing, 
  handleFollow, 
  handleUnfollow 
}: ChatHeaderProps) {
  const navigate = useNavigate();
  
  if (!selectedUser) return null;

  return (
    <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
      <div 
        className="flex items-center space-x-3 cursor-pointer" 
        onClick={() => navigate(`/profile/${selectedUser.id}`)}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={selectedUser.avatar_url || undefined} />
          <AvatarFallback>{selectedUser.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium">
            {selectedUser.full_name || selectedUser.username}
          </span>
          <span className="text-xs text-gray-500">
            {isFollowing ? 'Following' : ''}
          </span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {isFollowing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUnfollow(selectedUser.id)}
          >
            Unfollow
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => handleFollow(selectedUser.id)}
          >
            Follow
          </Button>
        )}
      </div>
    </div>
  );
}
