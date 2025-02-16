
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
        <motion.img
          whileHover={{ scale: 1.1 }}
          src={author.avatar_url || '/placeholder.svg'}
          alt={author.username}
          className="w-12 h-12 rounded-full border-2 border-purple-200"
        />
        <div>
          <h3 className="font-serif text-lg font-medium text-gray-800">{author.username}</h3>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {currentUserId && currentUserId !== author.id && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onFollowToggle}
            className="flex items-center gap-1 hover:bg-purple-50 transition-colors"
          >
            {isFollowing ? (
              <>
                <UserMinus className="w-4 h-4 text-purple-500" />
                <span className="text-purple-700">Unfollow</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 text-purple-500" />
                <span className="text-purple-700">Follow</span>
              </>
            )}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 rounded-full hover:bg-purple-50 transition-colors">
            <MoreVertical className="h-5 w-5 text-gray-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => window.location.href = `/profile/${author.id}`}>
              View Profile
            </DropdownMenuItem>
            {(currentUserId === author.id || isAdmin) && (
              <>
                <DropdownMenuItem onClick={onEdit}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-red-500">
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
