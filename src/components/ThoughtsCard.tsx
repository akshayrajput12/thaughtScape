
import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Heart, MessageCircle, Share2, Trash } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "./auth/AuthProvider";
import { useThoughtInteractions } from "@/hooks/use-thought-interactions";
import { ShareDialog } from "./poem/ShareDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ThoughtsCardProps {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string | null;
  createdAt: string;
  likes: number;
  hasLiked: boolean;
  commentsCount: number;
  refetch?: () => void;
}

export const ThoughtsCard = ({
  id,
  title,
  content,
  authorId,
  authorName,
  authorUsername,
  authorAvatar,
  createdAt,
  likes,
  hasLiked,
  commentsCount,
  refetch,
}: ThoughtsCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const { toggleLike } = useThoughtInteractions();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  
  const deleteThought = async () => {
    if (!user || (user.id !== authorId && !user.isAdmin)) return;
    
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('thoughts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        description: 'Thought deleted successfully'
      });
      
      if (refetch) refetch();
    } catch (error) {
      console.error('Error deleting thought:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to delete thought'
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const isOwnThought = user?.id === authorId;
  const isAdmin = user?.isAdmin;
  const canDelete = isOwnThought || isAdmin;
  
  // Truncate content if it's too long
  const truncatedContent = content.length > 300 
    ? content.substring(0, 297) + '...' 
    : content;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-purple-100/30"
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <Link
            to={`/profile/${authorId}`}
            className="flex items-center gap-3 mb-3 group"
          >
            <div className="relative w-10 h-10 rounded-full bg-purple-100 overflow-hidden flex items-center justify-center text-purple-500 font-medium border border-purple-200">
              {authorAvatar ? (
                <img 
                  src={authorAvatar} 
                  alt={authorName || authorUsername} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{(authorName || authorUsername)[0]?.toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-purple-700 transition-colors">
                {authorName || authorUsername}
              </h3>
              <p className="text-xs text-gray-500">
                {format(new Date(createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </Link>
          
          {canDelete && (
            <button
              onClick={deleteThought}
              disabled={isDeleting}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
            >
              <Trash size={18} />
            </button>
          )}
        </div>
        
        <Link to={`/thoughts/${id}`} className="block hover:opacity-90 transition-opacity">
          <h2 className="text-xl font-serif font-semibold text-gray-900 mb-2 hover:text-purple-700 transition-colors">
            {title}
          </h2>
          <p className="text-gray-600 whitespace-pre-line mb-4">{truncatedContent}</p>
        </Link>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => toggleLike(id)}
              className={`flex items-center gap-1 text-sm transition-colors ${
                hasLiked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'
              }`}
            >
              <Heart size={18} className={hasLiked ? 'fill-pink-500' : ''} />
              <span>{likes}</span>
            </button>
            
            <Link 
              to={`/thoughts/${id}`}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 transition-colors"
            >
              <MessageCircle size={18} />
              <span>{commentsCount}</span>
            </Link>
          </div>
          
          <button
            onClick={() => setIsShareDialogOpen(true)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-500 transition-colors"
          >
            <Share2 size={18} />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>
      
      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        thoughtId={id}
        title={title}
      />
    </motion.div>
  );
};
