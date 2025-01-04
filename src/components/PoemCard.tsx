import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePoemInteractions } from "@/hooks/use-poem-interactions";
import { PoemHeader } from "./poem/PoemHeader";
import { PoemContent } from "./poem/PoemContent";
import { PoemInteractionButtons } from "./poem/PoemInteractionButtons";
import type { Poem } from "@/types";

interface PoemCardProps {
  poem: Poem;
  currentUserId?: string;
  isAdmin?: boolean;
  onDelete?: (poemId: string) => void;
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
  } = usePoemInteractions(poem.id, currentUserId);

  const handleFollow = async () => {
    if (!currentUserId) {
      navigate('/auth');
      return;
    }

    try {
      if (!isFollowing) {
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
      toast({
        title: "Error",
        description: "Could not update follow status",
        variant: "destructive",
      });
    }
  };

  const handleEdit = () => {
    navigate(`/edit-poem/${poem.id}`);
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('poems')
        .delete()
        .eq('id', poem.id);

      if (error) throw error;

      if (onDelete) {
        onDelete(poem.id);
      }

      toast({
        title: "Success",
        description: "Poem deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not delete poem",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
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
      <PoemContent content={poem.content} />
      <div className="flex items-center justify-between text-sm text-gray-500">
        <PoemInteractionButtons
          likesCount={likesCount}
          bookmarksCount={bookmarksCount}
          isLiked={isLiked}
          isBookmarked={isBookmarked}
          onLike={handleLike}
          onBookmark={handleBookmark}
        />
        <div className="text-sm text-gray-500">
          {new Date(poem.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};