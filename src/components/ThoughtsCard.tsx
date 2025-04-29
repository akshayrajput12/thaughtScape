
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Heart, MessageCircle, Share2, Trash, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "./auth/AuthProvider";
import { useThoughtInteractions } from "@/hooks/use-thought-interactions";
import { ShareDialog } from "./poem/ShareDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const { handleLike } = useThoughtInteractions(id, user?.id);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const deleteThought = async () => {
    if (!user) return;

    // Check if user is admin by querying the profiles table
    let isUserAdmin = false;
    if (user.id !== authorId) {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      isUserAdmin = !!data?.is_admin;
    }

    if (user.id !== authorId && !isUserAdmin) return;

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

  // Fetch followers for sharing dialog when opened
  const fetchFollowers = async () => {
    if (!user?.id) return;

    try {
      // Fix the query to avoid passing a PostgrestFilterBuilder to an array function
      const { data: followingIds } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (!followingIds?.length) {
        setFollowers([]);
        return;
      }

      const ids = followingIds.map(item => item.following_id);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', ids);

      if (error) throw error;
      setFollowers(data || []);
    } catch (error) {
      console.error('Error fetching followers:', error);
      setFollowers([]);
    }
  };

  const handleShare = (followerId: string) => {
    toast({
      description: 'Thought shared successfully!'
    });
    setShareDialogOpen(false);
  };

  // Check if user is admin
  useEffect(() => {
    const checkIsAdmin = async () => {
      if (!user?.id) return false;

      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      setIsAdmin(!!data?.is_admin);
    };

    if (user?.id) {
      checkIsAdmin();
    }
  }, [user?.id]);

  const isOwnThought = user?.id === authorId;
  const canDelete = isOwnThought || isAdmin;

  // Check if content is long enough to need truncation
  const isLongContent = content.length > 300;
  const displayContent = expanded || !isLongContent ? content : content.substring(0, 300);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-purple-100/30 dark:border-purple-900/30"
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
              <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                {authorName || authorUsername}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </Link>

          {canDelete && (
            <button
              onClick={deleteThought}
              disabled={isDeleting}
              className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors p-1"
            >
              <Trash size={18} />
            </button>
          )}
        </div>

        <Link to={`/thoughts/${id}`} className="block hover:opacity-90 transition-opacity">
          <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100 mb-2 hover:text-purple-700 dark:hover:text-purple-400 transition-colors">
            {title}
          </h2>
          <p className={cn(
            "text-gray-600 dark:text-gray-300 whitespace-pre-line",
            !expanded && isLongContent && "line-clamp-3"
          )}>
            {displayContent}
          </p>
        </Link>

        {isLongContent && (
          <Button
            variant={expanded ? "ghost" : "secondary"}
            size="sm"
            className={cn(
              "mt-2 h-8 text-xs px-4 font-medium shadow-sm",
              expanded
                ? "text-muted-foreground hover:text-foreground"
                : "bg-gradient-to-r from-blue-500/90 to-indigo-500/90 hover:from-blue-600 hover:to-indigo-600 text-white dark:from-blue-600/90 dark:to-indigo-600/90"
            )}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                Read More
              </>
            )}
          </Button>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleLike()}
              className={`flex items-center gap-1 text-sm transition-colors ${
                hasLiked ? 'text-pink-500' : 'text-gray-500 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400'
              }`}
            >
              <Heart size={18} className={hasLiked ? 'fill-pink-500' : ''} />
              <span>{likes}</span>
            </button>

            <Link
              to={`/thoughts/${id}`}
              className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              <MessageCircle size={18} />
              <span>{commentsCount}</span>
            </Link>
          </div>

          <button
            onClick={() => {
              fetchFollowers();
              setShareDialogOpen(true);
            }}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors"
          >
            <Share2 size={18} />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        followers={followers}
        onShare={handleShare}
      />
    </motion.div>
  );
};
