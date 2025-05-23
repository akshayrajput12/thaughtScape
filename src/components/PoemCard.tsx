
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
import { useQueryClient } from "@tanstack/react-query";

interface PoemCardProps {
  poem: Thought;
  currentUserId?: string;
  isAdmin?: boolean;
  onDelete?: (thoughtId: string) => void;
}

export const PoemCard = ({ poem, currentUserId, isAdmin, onDelete }: PoemCardProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [followers, setFollowers] = useState<Profile[]>([]);

  // Fetch followers when share dialog is opened
  useEffect(() => {
    const fetchFollowers = async () => {
      if (!currentUserId || !showShareDialog) return;

      try {
        // Get users that the current user is following
        const { data: followingIds, error: followingError } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUserId);

        if (followingError) throw followingError;

        if (!followingIds?.length) {
          setFollowers([]);
          return;
        }

        const ids = followingIds.map(item => item.following_id);

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .in('id', ids);

        if (error) throw error;
        setFollowers(data || []);
      } catch (error) {
        console.error('Error fetching followers:', error);
        setFollowers([]);
      }
    };

    fetchFollowers();
  }, [currentUserId, showShareDialog]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
      // Check if poem.author exists before accessing its properties
      if (!currentUserId || !poem.author || currentUserId === poem.author.id) return;

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
  }, [currentUserId, poem.author?.id]);

  const handleFollowToggle = async () => {
    if (!currentUserId) {
      navigate('/auth');
      return;
    }

    // Check if poem.author exists
    if (!poem.author) {
      toast({
        title: "Error",
        description: "Author information is missing",
        variant: "destructive",
      });
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

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['profile', poem.author.id] });

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

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['profile', poem.author.id] });

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
      // Use notifications instead of messages for sharing
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          type: 'share',
          content: `Shared thought: "${poem.title}"`,
          related_user_id: currentUserId,
          related_thought_id: poem.id
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
    navigate(`/thought/${poem.id}/edit`);
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
      className="group relative max-w-2xl mx-auto bg-card rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-border"
    >
      <div className="relative p-5 sm:p-6">
        {poem.author ? (
          <>
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
              className="mt-6 pt-4 border-t border-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  <PoemInteractionButtons
                    likesCount={likesCount}
                    bookmarksCount={bookmarksCount}
                    isLiked={isLiked}
                    isBookmarked={isBookmarked}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                    onShare={() => setShowShareDialog(true)}
                    thoughtId={poem.id}
                    showAnimation={true}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
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
          </>
        ) : (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">This post's author information is unavailable.</p>
            <motion.div
              className="my-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <PoemContent content={poem.content} />
            </motion.div>
          </div>
        )}
      </div>

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        followers={followers}
        onShare={handleShare}
        thoughtId={poem.id}
      />
    </motion.div>
  );
};
