
import { Link } from "react-router-dom";
import { MoreVertical, UserPlus, UserMinus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/types";

interface PoemHeaderProps {
  author: Profile;
  title: string;
  currentUserId?: string;
  isAdmin?: boolean;
  isFollowing: boolean;
  onFollowToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const PoemHeader = ({
  author,
  title,
  currentUserId,
  isAdmin,
  isFollowing,
  onFollowToggle,
  onEdit,
  onDelete
}: PoemHeaderProps) => {
  return (
    <motion.div
      className="flex justify-between items-start mb-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center gap-4">
        <Link to={`/profile/${author.id}`}>
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="cursor-pointer"
          >
            <Avatar className="w-12 h-12 border-2 border-primary/20">
              <AvatarImage src={author.avatar_url || ''} alt={author.username} />
              <AvatarFallback>{author.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </motion.div>
        </Link>
        <div>
          <Link to={`/profile/${author.id}`}>
            <h3 className="font-serif text-lg font-medium text-foreground hover:text-primary transition-colors cursor-pointer">{author.username}</h3>
          </Link>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {currentUserId && currentUserId !== author.id && (
          <Button
            variant={isFollowing ? "destructive" : "default"}
            size="sm"
            onClick={onFollowToggle}
            className="flex items-center gap-1 transition-all duration-300"
          >
            {isFollowing ? (
              <>
                <UserMinus className="w-4 h-4 mr-1" />
                <span>Unfollow</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-1" />
                <span>Follow</span>
              </>
            )}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 rounded-full hover:bg-muted transition-colors">
            <MoreVertical className="h-5 w-5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Link to={`/profile/${author.id}`}>View Profile</Link>
            </DropdownMenuItem>
            {(currentUserId === author.id || isAdmin) && (
              <>
                <DropdownMenuItem onClick={onEdit}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};
