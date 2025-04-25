
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Thought } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Heart, 
  Bookmark, 
  Share2,
  MoreHorizontal
} from 'lucide-react';

interface ThoughtCardProps {
  thought: Thought;
}

export const ThoughtCard = ({ thought }: ThoughtCardProps) => {
  const navigate = useNavigate();
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  const handleProfileClick = () => {
    navigate(`/profile/${thought.author.id}`);
  };
  
  const handleThoughtClick = () => {
    navigate(`/thought/${thought.id}`);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3" onClick={handleProfileClick}>
            <Avatar className="h-10 w-10 cursor-pointer">
              <AvatarImage src={thought.author.avatar_url || ''} />
              <AvatarFallback>{thought.author.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">{thought.author.full_name || thought.author.username}</p>
              <p className="text-xs text-gray-500">{formatDate(thought.created_at)}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreHorizontal className="h-5 w-5 text-gray-500" />
          </Button>
        </div>
        
        <div onClick={handleThoughtClick} className="cursor-pointer">
          <h3 className="font-semibold text-lg mb-1">{thought.title}</h3>
          <p className="text-gray-600 mb-3 line-clamp-3">{thought.content}</p>
          
          {thought.image_url && (
            <div className="mb-3 rounded-lg overflow-hidden">
              <img 
                src={thought.image_url} 
                alt={thought.title} 
                className="w-full h-48 object-cover"
              />
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-gray-500">
            <div className="flex items-center space-x-1">
              <Heart className="h-4 w-4" />
              <span className="text-xs">{thought._count?.likes || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs">{thought._count?.comments || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Bookmark className="h-4 w-4" />
              <span className="text-xs">{thought._count?.bookmarks || 0}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-xs">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
};
