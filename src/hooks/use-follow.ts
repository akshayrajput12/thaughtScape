import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useFollow = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const followUser = async (followerId: string, followingId: string) => {
    try {
      setLoading(true);
      
      // Check if already following
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (existingFollow) {
        toast({
          title: "Already following",
          description: "You are already following this user",
        });
        return;
      }

      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: followerId,
          following_id: followingId
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already following",
            description: "You are already following this user",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Success",
        description: "Successfully followed user",
      });
    } catch (error) {
      console.error('Error following user:', error);
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