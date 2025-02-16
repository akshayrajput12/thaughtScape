import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useThoughtInteractions } from "@/hooks/use-thought-interactions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, UserPlus, UserMinus } from "lucide-react";
import { PoemContent } from "./poem/PoemContent";
import { PoemInteractionButtons } from "./poem/PoemInteractionButtons";
import { CommentSection } from "./poem/CommentSection";
import type { Thought, Profile } from "@/types";

interface PoemCardProps {
  poem: Thought;
  currentUserId?: string;
  isAdmin?: boolean;
  onDelete?: (thoughtId: string) => void;
}

export const PoemCard = ({ poem, currentUserId, isAdmin, onDelete }: PoemCardProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    likesCount,
    bookmarksCount,
    isLiked,
    isBookmarked,
    handleLike,
    handleBookmark
  } = useThoughtInteractions(poem.id, currentUserId);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUserId || currentUserId === poem.author.id) return;

      const { data, error } = await supabase
        .from('follows')
        .select()
        .eq('follower_id', currentUserId)
        .eq('following_id', poem.author.id)
        .maybeSingle();

      if (!error) {
        setIsFollowing(!!data);
      }
    };

    checkFollowStatus();
  }, [currentUserId, poem.author.id]);

  const handleFollowToggle = async () => {
    if (!currentUserId) {
      navigate('/auth');
      return;
    }

    if (currentUserId === poem.author.id) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', poem.author.id);

        if (error) throw error;

        setIsFollowing(false);
        toast({
          title: "Success",
          description: "Unfollowed successfully",
        });
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: poem.author.id
          });

        if (error) throw error;

        // Create notification for followed user
        await supabase
          .from('notifications')
          .insert({
            type: 'follow',
            user_id: poem.author.id,
            content: 'Someone started following you',
            related_user_id: currentUserId
          });

        setIsFollowing(true);
        toast({
          title: "Success",
          description: "Followed successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update follow status",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (recipientId: string) => {
    if (!currentUserId) {
      navigate('/auth');
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: recipientId,
          content: `Shared thought: "${poem.title}" - ${window.location.origin}/thought/${poem.id}`
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Thought shared successfully",
      });
      setShowShareDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not share thought",
        variant: "destructive",
      });
    }
  };

  const handleEdit = () => {
    navigate(`/edit-thought/${poem.id}`);
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('thoughts')
        .delete()
        .eq('id', poem.id);

      if (error) throw error;

      if (onDelete) {
        onDelete(poem.id);
      }

      toast({
        title: "Success",
        description: "Thought deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not delete thought",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group relative max-w-2xl mx-auto bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-transparent to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <img
              src={poem.author.avatar_url || '/placeholder.svg'}
              alt={poem.author.username}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h3 className="font-medium">{poem.author.username}</h3>
              <p className="text-sm text-gray-500">{poem.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentUserId && currentUserId !== poem.author.id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFollowToggle}
                className="flex items-center gap-1"
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    <span>Unfollow</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Follow</span>
                  </>
                )}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger className="p-2 rounded-full hover:bg-gray-100">
                <MoreVertical className="h-5 w-5 text-gray-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => navigate(`/profile/${poem.author.id}`)}>
                  View Profile
                </DropdownMenuItem>
                {(currentUserId === poem.author.id || isAdmin) && (
                  <>
                    <DropdownMenuItem onClick={handleEdit}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="my-6">
          <PoemContent content={poem.content} />
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              <PoemInteractionButtons
                likesCount={likesCount}
                bookmarksCount={bookmarksCount}
                isLiked={isLiked}
                isBookmarked={isBookmarked}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onShare={() => setShowShareDialog(true)}
                showAnimation={true}
              />
            </div>
            <span className="text-sm text-gray-400">
              {new Date(poem.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
          
          <CommentSection
            thoughtId={poem.id}
            currentUserId={currentUserId}
            thoughtAuthorId={poem.author.id}
          />
        </div>
      </div>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Thought</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {followers.length === 0 ? (
              <p className="text-center text-gray-500">You're not following anyone yet</p>
            ) : (
              followers.map((follower) => (
                <Button
                  key={follower.id}
                  variant="outline"
                  className="flex items-center gap-2 w-full"
                  onClick={() => handleShare(follower.id)}
                >
                  <img
                    src={follower.avatar_url || '/placeholder.svg'}
                    alt={follower.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{follower.full_name || follower.username}</span>
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
