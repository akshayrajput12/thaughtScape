import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePoemInteractions } from "@/hooks/use-poem-interactions";
import { PoemInteractionButtons } from "@/components/poem/PoemInteractionButtons";
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

  const canModify = currentUserId === poem.author.id || isAdmin;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <img
            src={poem.author.avatar_url || "/placeholder.svg"}
            alt={poem.author.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="text-2xl font-serif font-semibold mb-1">{poem.title}</h3>
            <button
              onClick={() => navigate(`/profile/${poem.author.id}`)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              by {poem.author.full_name || poem.author.username}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentUserId && currentUserId !== poem.author.id && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFollow}
              className={isFollowing ? "bg-primary/10" : ""}
            >
              <UserPlus className="w-4 h-4 mr-1" />
              {isFollowing ? "Following" : "Follow"}
            </Button>
          )}
          {canModify && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                <Trash className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      <p className="text-gray-700 mb-4 whitespace-pre-line">{poem.content}</p>
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