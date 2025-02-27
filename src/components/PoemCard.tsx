import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useThoughtInteractions } from "@/hooks/use-thought-interactions";
import { PoemContent } from "./poem/PoemContent";
import { PoemInteractionButtons } from "./poem/PoemInteractionButtons";
import { CommentSection } from "./poem/CommentSection";
import { PoemHeader } from "./poem/PoemHeader";
import { ShareDialog } from "./poem/ShareDialog";
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
  const [commentsCount, setCommentsCount] = useState(0);
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
    const fetchCommentsCount = async () => {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('thought_id', poem.id);
      
      setCommentsCount(count || 0);
    };

    fetchCommentsCount();
  }, [poem.id]);

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
        <PoemHeader
          author={poem.author}
          title={poem.title}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          isFollowing={isFollowing}
          onFollowToggle={handleFollowToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        
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
            <div className="flex gap-4 items-center">
              <PoemInteractionButtons
                likesCount={likesCount}
                bookmarksCount={bookmarksCount}
                commentsCount={commentsCount}
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

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        followers={followers}
        onShare={handleShare}
      />
    </motion.div>
  );
};
