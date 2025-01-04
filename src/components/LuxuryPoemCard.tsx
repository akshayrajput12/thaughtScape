import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Bookmark, Share2, UserPlus, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const [likesCount, setLikesCount] = useState(poem._count?.likes || 0);
  const [bookmarksCount, setBookmarksCount] = useState(poem._count?.bookmarks || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (currentUserId) {
      // Check if user has liked the poem
      const checkLike = async () => {
        const { data: likeData } = await supabase
          .from('likes')
          .select()
          .eq('poem_id', poem.id)
          .eq('user_id', currentUserId)
          .single();
        setIsLiked(!!likeData);
      };

      // Check if user has bookmarked the poem
      const checkBookmark = async () => {
        const { data: bookmarkData } = await supabase
          .from('bookmarks')
          .select()
          .eq('poem_id', poem.id)
          .eq('user_id', currentUserId)
          .single();
        setIsBookmarked(!!bookmarkData);
      };

      checkLike();
      checkBookmark();
    }
  }, [poem.id, currentUserId]);

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
            poem_id: poem.id,
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
          .eq('poem_id', poem.id)
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
            poem_id: poem.id,
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
          .eq('poem_id', poem.id)
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
        <div className="flex items-center gap-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            className={`flex items-center gap-2 transition-colors ${
              isLiked ? 'text-red-500' : 'hover:text-red-500'
            }`}
            onClick={handleLike}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likesCount}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            className={`flex items-center gap-2 transition-colors ${
              isBookmarked ? 'text-blue-500' : 'hover:text-blue-500'
            }`}
            onClick={handleBookmark}
          >
            <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
            <span>{bookmarksCount}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            className="hover:text-gray-700 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </motion.button>
        </div>
        <span className="text-sm text-gray-400">
          {new Date(poem.created_at).toLocaleDateString()}
        </span>
      </div>
    </motion.div>
  );
};