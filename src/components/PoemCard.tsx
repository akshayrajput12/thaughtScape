import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useThoughtInteractions } from "@/hooks/use-thought-interactions";
import { PoemHeader } from "./poem/PoemHeader";
import { PoemContent } from "./poem/PoemContent";
import { PoemInteractionButtons } from "./poem/PoemInteractionButtons";
import type { Thought } from "@/types";

interface PoemCardProps {
  poem: Thought;
  currentUserId?: string;
  isAdmin?: boolean;
  onDelete?: (thoughtId: string) => void;
}

export const PoemCard = ({ poem, currentUserId, isAdmin, onDelete }: PoemCardProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
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
      if (!currentUserId) return;
      
      try {
        const { data, error } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', currentUserId)
          .eq('following_id', poem.author.id)
          .maybeSingle();

        if (error) throw error;
        setIsFollowing(!!data);
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    };

    checkFollowStatus();
  }, [currentUserId, poem.author.id]);

  const handleFollow = async () => {
    if (!currentUserId) {
      navigate('/auth');
      return;
    }

    try {
      if (!isFollowing) {
        // Check if already following
        const { data: existingFollow } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', currentUserId)
          .eq('following_id', poem.author.id)
          .maybeSingle();

        if (existingFollow) {
          toast({
            title: "Already following",
            description: `You are already following ${poem.author.username}`,
          });
          setIsFollowing(true);
          return;
        }

        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: poem.author.id
          });

        if (error) throw error;

        setIsFollowing(true);
        toast({
          title: "Success",
          description: `You are now following ${poem.author.username}`,
        });
      } else {
        const { error } = await supabase
          .from('follows')
          .delete()
          .match({
            follower_id: currentUserId,
            following_id: poem.author.id
          });

        if (error) throw error;

        setIsFollowing(false);
        toast({
          title: "Success",
          description: `You have unfollowed ${poem.author.username}`,
        });
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
      toast({
        title: "Error",
        description: "Could not update follow status",
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
      className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative p-6">
        <PoemHeader
          title={poem.title}
          author={poem.author}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onFollow={handleFollow}
          isFollowing={isFollowing}
        />
        
        <div className="my-6 border-t border-gray-100" />
        
        <PoemContent content={poem.content} />
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <PoemInteractionButtons
              likesCount={likesCount}
              bookmarksCount={bookmarksCount}
              isLiked={isLiked}
              isBookmarked={isBookmarked}
              onLike={handleLike}
              onBookmark={handleBookmark}
              showAnimation={true}
            />
            <span className="text-sm text-gray-400 font-medium">
              {new Date(poem.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
