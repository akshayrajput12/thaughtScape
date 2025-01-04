import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const usePoemInteractions = (poemId: string, currentUserId?: string) => {
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (currentUserId) {
      const checkInteractions = async () => {
        // Check if user has liked the poem
        const { data: likeData } = await supabase
          .from('likes')
          .select()
          .eq('poem_id', poemId)
          .eq('user_id', currentUserId)
          .maybeSingle();
        setIsLiked(!!likeData);

        // Check if user has bookmarked the poem
        const { data: bookmarkData } = await supabase
          .from('bookmarks')
          .select()
          .eq('poem_id', poemId)
          .eq('user_id', currentUserId)
          .maybeSingle();
        setIsBookmarked(!!bookmarkData);

        // Get counts
        const { count: likesCount } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('poem_id', poemId);
        setLikesCount(likesCount || 0);

        const { count: bookmarksCount } = await supabase
          .from('bookmarks')
          .select('*', { count: 'exact', head: true })
          .eq('poem_id', poemId);
        setBookmarksCount(bookmarksCount || 0);
      };

      checkInteractions();
    }
  }, [poemId, currentUserId]);

  const handleLike = async () => {
    if (!currentUserId) {
      navigate('/auth');
      return;
    }

    try {
      if (!isLiked) {
        const { error } = await supabase
          .from('likes')
          .insert({
            poem_id: poemId,
            user_id: currentUserId
          });

        if (error) throw error;

        setLikesCount(prev => prev + 1);
        setIsLiked(true);
        toast({
          title: "Success",
          description: "Poem liked successfully",
        });
      } else {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('poem_id', poemId)
          .eq('user_id', currentUserId);

        if (error) throw error;

        setLikesCount(prev => prev - 1);
        setIsLiked(false);
        toast({
          title: "Success",
          description: "Poem unliked successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update like status",
        variant: "destructive",
      });
    }
  };

  const handleBookmark = async () => {
    if (!currentUserId) {
      navigate('/auth');
      return;
    }

    try {
      if (!isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            poem_id: poemId,
            user_id: currentUserId
          });

        if (error) throw error;

        setBookmarksCount(prev => prev + 1);
        setIsBookmarked(true);
        toast({
          title: "Success",
          description: "Poem bookmarked successfully",
        });
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('poem_id', poemId)
          .eq('user_id', currentUserId);

        if (error) throw error;

        setBookmarksCount(prev => prev - 1);
        setIsBookmarked(false);
        toast({
          title: "Success",
          description: "Bookmark removed successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update bookmark status",
        variant: "destructive",
      });
    }
  };

  return {
    likesCount,
    bookmarksCount,
    isLiked,
    isBookmarked,
    handleLike,
    handleBookmark
  };
};