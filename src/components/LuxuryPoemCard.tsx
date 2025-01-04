import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePoemInteractions } from "@/hooks/use-poem-interactions";
import { PoemInteractionButtons } from "@/components/poem/PoemInteractionButtons";
import type { Poem } from "@/types";

interface LuxuryPoemCardProps {
  poem: Poem;
  currentUserId?: string;
  isAdmin?: boolean;
  onDelete?: (poemId: string) => void;
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
  } = usePoemInteractions(poem.id, currentUserId);

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-white to-primary/5 rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <motion.img
            whileHover={{ scale: 1.1 }}
            src={poem.author.avatar_url || "/placeholder.svg"}
            alt={poem.author.username}
            className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
          />
          <div className="text-left">
            <h3 className="text-2xl font-serif font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
              {poem.title}
            </h3>
            <p className="text-sm text-gray-600">
              by {poem.author.full_name || poem.author.username}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentUserId && currentUserId !== poem.author.id && (
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-primary/10 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Follow
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
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <p className="text-gray-700 whitespace-pre-line leading-relaxed font-serif">
          {poem.content}
        </p>
      </motion.div>

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