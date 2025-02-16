
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
      className="group relative max-w-2xl mx-auto bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border border-purple-100/50"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative p-6 sm:p-8">
        <motion.div 
          className="flex justify-between items-start mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-4">
            <motion.img
              whileHover={{ scale: 1.1 }}
              src={poem.author.avatar_url || '/placeholder.svg'}
              alt={poem.author.username}
              className="w-12 h-12 rounded-full border-2 border-purple-200"
            />
            <div>
              <h3 className="font-serif text-lg font-medium text-gray-800">{poem.author.username}</h3>
              <p className="text-sm text-gray-500">{poem.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentUserId && currentUserId !== poem.author.id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFollowToggle}
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
        </motion.div>
        
        <motion.div 
          className="my-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <PoemContent content={poem.content} />
        </motion.div>
        
        <motion.div 
          className="mt-6 pt-4 border-t border-purple-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
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
            <span className="text-sm text-gray-400 font-medium">
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
        </motion.div>
      </div>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-serif">Share Thought</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {followers.length === 0 ? (
              <p className="text-center text-gray-500">You're not following anyone yet</p>
            ) : (
              followers.map((follower) => (
                <Button
                  key={follower.id}
                  variant="outline"
                  className="flex items-center gap-3 w-full p-4 hover:bg-purple-50 transition-colors"
                  onClick={() => handleShare(follower.id)}
                >
                  <img
                    src={follower.avatar_url || '/placeholder.svg'}
                    alt={follower.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <span className="font-medium">{follower.full_name || follower.username}</span>
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
