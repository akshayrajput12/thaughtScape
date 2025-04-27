
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  MessageSquare, 
  Bookmark, 
  Share2, 
  MoreVertical
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import type { Thought } from "@/types";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThoughtCardProps {
  thought: Thought;
  onDelete?: (id: string) => void;
  showAuthor?: boolean;
  isCurrentUserAuthor?: boolean;
  isAdmin?: boolean;
}

export const ThoughtCard = ({ 
  thought, 
  onDelete,
  showAuthor = true,
  isCurrentUserAuthor = false,
  isAdmin = false
}: ThoughtCardProps) => {
  const authorName = thought.author?.full_name || thought.author?.username || 'Unknown';
  const likes = thought._count?.likes || thought.likes_count || 0;
  const bookmarks = thought._count?.bookmarks || 0;
  const comments = thought._count?.comments || thought.comments_count || 0;
  
  return (
    <Card className="h-full flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        {showAuthor && (
          <div className="flex justify-between items-center">
            <Link to={`/profile/${thought.author?.id}`} className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={thought.author?.avatar_url || ''} />
                <AvatarFallback>{authorName[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{authorName}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(thought.created_at), { addSuffix: true })}
                </p>
              </div>
            </Link>
            
            {(isCurrentUserAuthor || isAdmin) && onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    className="text-red-500 cursor-pointer"
                    onClick={() => onDelete(thought.id)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
        
        <Link to={`/thought/${thought.id}`}>
          <h3 className="text-lg font-semibold mt-2">{thought.title}</h3>
        </Link>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <Link to={`/thought/${thought.id}`} className="text-gray-700">
          <p className="line-clamp-5">{thought.content}</p>
          {thought.image_url && (
            <div className="mt-3 h-48 overflow-hidden rounded">
              <img 
                src={thought.image_url} 
                alt={thought.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </Link>
      </CardContent>
      
      <CardFooter className="border-t pt-3 flex justify-between text-gray-500 text-sm">
        <Button variant="ghost" size="sm" className="gap-1">
          <Heart className="h-4 w-4" /> 
          <span>{likes}</span>
        </Button>
        
        <Button variant="ghost" size="sm" className="gap-1">
          <MessageSquare className="h-4 w-4" /> 
          <span>{comments}</span>
        </Button>
        
        <Button variant="ghost" size="sm" className="gap-1">
          <Bookmark className="h-4 w-4" />
          <span>{bookmarks}</span>
        </Button>
        
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
