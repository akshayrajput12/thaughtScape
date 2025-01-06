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
      const { data: existingFollow, error: checkError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw checkError;
      }

      if (existingFollow) {
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
        // Handle unique constraint violation
        if (insertError.code === '23505') {
          toast({
            title: "Already following",
            description: "You are already following this user",
          });
        } else {
          throw insertError;
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