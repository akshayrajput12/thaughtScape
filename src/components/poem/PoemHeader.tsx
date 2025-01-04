import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, Edit, Trash, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Profile } from "@/types";

interface PoemHeaderProps {
  title: string;
  author: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url?: string | null;
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
  isFollowing,
}: PoemHeaderProps) => {
  const navigate = useNavigate();
  const canModify = currentUserId === author.id || isAdmin;

  return (
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-4">
        <Avatar className="w-12 h-12 border-2 border-primary/20">
          <AvatarImage src={author.avatar_url || undefined} alt={author.username} />
          <AvatarFallback>
            <User className="w-6 h-6 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-2xl font-serif font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
            {title}
          </h3>
          <button
            onClick={() => navigate(`/profile/${author.id}`)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            by {author.full_name || author.username}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {currentUserId && currentUserId !== author.id && (
          <Button
            variant={isFollowing ? "secondary" : "outline"}
            size="sm"
            onClick={onFollow}
            className="transition-all duration-200"
          >
            <UserPlus className="w-4 h-4 mr-1" />
            {isFollowing ? "Following" : "Follow"}
          </Button>
        )}
        {canModify && (
          <>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};