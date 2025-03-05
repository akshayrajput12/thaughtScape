
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { useQueryClient } from "@tanstack/react-query";

export const useFollow = (userId: string, targetId: string, initialIsFollowing = false) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleFollow = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to follow users",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', targetId);

        if (error) throw error;

        setIsFollowing(false);
        toast({
          title: "Success",
          description: "Unfollowed successfully",
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: userId,
            following_id: targetId
          });

        if (error) throw error;

        // Create notification for the target user
        await supabase
          .from('notifications')
          .insert({
            user_id: targetId,
            type: 'follow',
            content: 'Someone started following you',
            related_user_id: userId
          });

        setIsFollowing(true);
        toast({
          title: "Success",
          description: "Followed successfully",
        });
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['profile', targetId] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['followers', targetId] });
      queryClient.invalidateQueries({ queryKey: ['following', userId] });
      
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { isFollowing, isLoading, toggleFollow, setIsFollowing };
};
