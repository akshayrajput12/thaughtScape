
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useThoughtInteractions } from "@/hooks/use-thought-interactions";
import { PoemHeader } from "./poem/PoemHeader";
import { PoemContent } from "./poem/PoemContent";
import { PoemInteractionButtons } from "./poem/PoemInteractionButtons";
import type { Thought } from "@/types";

interface LuxuryPoemCardProps {
  poem: Thought;
  currentUserId?: string;
  isAdmin?: boolean;
  onDelete?: (thoughtId: string) => void;
}

export const LuxuryPoemCard = ({ poem, currentUserId, isAdmin, onDelete }: LuxuryPoemCardProps) => {
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
      className="bg-gradient-to-br from-white to-primary/5 rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow"
    >
      <PoemHeader
        title={poem.title}
        author={poem.author}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <PoemContent content={poem.content} isLuxury />
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
        <span className="text-sm text-gray-400">
          {new Date(poem.created_at).toLocaleDateString()}
        </span>
      </div>
    </motion.div>
  );
};
