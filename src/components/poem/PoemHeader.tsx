import { Link } from "react-router-dom";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface PoemHeaderProps {
  title: string;
  author: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  currentUserId?: string;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onFollow?: () => void;
  isFollowing?: boolean;
}

export const PoemHeader = ({
  title,
  author,
  currentUserId,
  isAdmin,
  onEdit,
  onDelete,
  onFollow,
  isFollowing
}: PoemHeaderProps) => {
  const isAuthor = currentUserId === author.id;
  const showActions = isAuthor || isAdmin;

  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <Link to={`/profile/${author.id}`}>
          <Avatar>
            <AvatarImage src={author.avatar_url} alt={author.username} />
            <AvatarFallback>{author.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <h2 className="text-xl font-serif font-semibold">{title}</h2>
          <Link 
            to={`/profile/${author.id}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {author.full_name || author.username}
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!isAuthor && currentUserId && onFollow && (
          <Button
            variant="outline"
            size="sm"
            onClick={onFollow}
          >
            {isFollowing ? 'Unfollow' : 'Follow'}
          </Button>
        )}
        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};