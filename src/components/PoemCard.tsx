
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useThoughtInteractions } from "@/hooks/use-thought-interactions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PoemHeader } from "./poem/PoemHeader";
import { PoemContent } from "./poem/PoemContent";
import { PoemInteractionButtons } from "./poem/PoemInteractionButtons";
import type { Thought, Profile } from "@/types";

interface PoemCardProps {
  poem: Thought;
  currentUserId?: string;
  isAdmin?: boolean;
  onDelete?: (thoughtId: string) => void;
}

export const PoemCard = ({ poem, currentUserId, isAdmin, onDelete }: PoemCardProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
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

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!currentUserId) return;
      
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following:profiles!follows_following_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('follower_id', currentUserId);

      if (error) {
        console.error('Error fetching followers:', error);
        return;
      }

      setFollowers(data.map(d => d.following) as Profile[]);
    };

    fetchFollowers();
  }, [currentUserId]);

  const handleShare = async (recipientId: string) => {
    if (!currentUserId) {
      navigate('/auth');
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: recipientId,
          content: `Shared thought: "${poem.title}" - ${window.location.origin}/thought/${poem.id}`
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Thought shared successfully",
      });
      setShowShareDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not share thought",
        variant: "destructive",
      });
    }
  };

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
      className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-transparent to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative p-6">
        <PoemHeader
          title={poem.title}
          author={poem.author}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        
        <div className="my-6">
          <PoemContent content={poem.content} />
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
              <DialogTrigger asChild>
                <div>
                  <PoemInteractionButtons
                    likesCount={likesCount}
                    bookmarksCount={bookmarksCount}
                    isLiked={isLiked}
                    isBookmarked={isBookmarked}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                    onShare={() => setShowShareDialog(true)}
                    showAnimation={true}
                  />
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Thought</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {followers.length === 0 ? (
                    <p className="text-center text-gray-500">You're not following anyone yet</p>
                  ) : (
                    followers.map((follower) => (
                      <Button
                        key={follower.id}
                        variant="outline"
                        className="flex items-center gap-2 w-full"
                        onClick={() => handleShare(follower.id)}
                      >
                        <img
                          src={follower.avatar_url || '/placeholder.svg'}
                          alt={follower.username}
                          className="w-8 h-8 rounded-full"
                        />
                        <span>{follower.full_name || follower.username}</span>
                      </Button>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <span className="text-sm text-gray-400">
              {new Date(poem.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
