
import React from "react";
import { Heart, MessageSquare, UserPlus, Tag, CheckCircle2, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

type NotificationType = 'like' | 'comment' | 'follow' | 'tag' | 'project_verification';

interface NotificationItemProps {
  id: string;
  type: NotificationType;
  content: string;
  isRead: boolean;
  createdAt: string;
  relatedUserId?: string;
  relatedThoughtId?: string;
  relatedUser?: {
    id: string;
    username: string;
    fullName?: string;
    avatarUrl?: string;
  };
  onMarkAsRead: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NotificationItem({
  id,
  type,
  content,
  isRead,
  createdAt,
  relatedUserId,
  relatedThoughtId,
  relatedUser,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (!isRead) {
      onMarkAsRead(id);
    }
    
    if (type === 'follow' && relatedUserId) {
      navigate(`/profile/${relatedUserId}`);
    } else if (['like', 'comment', 'tag'].includes(type) && relatedThoughtId) {
      navigate(`/thought/${relatedThoughtId}`);
    } else if (type === 'project_verification' && relatedThoughtId) {
      navigate(`/project/${relatedThoughtId}`);
    }
  };
  
  const renderIcon = () => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'tag':
        return <Tag className="h-4 w-4 text-purple-500" />;
      case 'project_verification':
        return content.includes('approved') 
          ? <CheckCircle2 className="h-4 w-4 text-green-500" />
          : <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors",
        !isRead && "bg-muted/30"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {type === 'project_verification' ? (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              {renderIcon()}
            </div>
          ) : relatedUser ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={relatedUser.avatarUrl} alt={relatedUser.username} />
              <AvatarFallback>
                {relatedUser.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              {renderIcon()}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm", !isRead && "font-medium")}>
            {content}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(createdAt), "MMM d, yyyy • h:mm a")}
          </p>
        </div>
        
        {onDelete && (
          <button
            className="text-muted-foreground hover:text-destructive transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
