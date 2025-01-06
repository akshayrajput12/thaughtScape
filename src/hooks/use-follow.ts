import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useFollow = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const followUser = async (followerId: string, followingId: string) => {
    try {
      setLoading(true);
      console.log('Following user:', { followerId, followingId });
      
      // Check if already following
      const { data: existingFollow, error: checkError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking follow status:', checkError);
        throw checkError;
      }

      if (existingFollow) {
        console.log('Already following this user');
        toast({
          title: "Already following",
          description: "You are already following this user",
        });
        return;
      }

      const { error: insertError } = await supabase
        .from('follows')
        .insert({
          follower_id: followerId,
          following_id: followingId
        });

      if (insertError) {
        console.error('Error following user:', insertError);
        toast({
          title: "Error",
          description: "Could not follow user. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Successfully followed user",
      });
    } catch (error) {
      console.error('Error in followUser:', error);
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    followUser,
    loading
  };
};