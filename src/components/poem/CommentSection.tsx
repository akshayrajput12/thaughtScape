
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, ThumbsUp, Trash, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author: Profile;
}

interface CommentSectionProps {
  thoughtId: string;
  currentUserId?: string;
  thoughtAuthorId: string;
}

export const CommentSection = ({ thoughtId, currentUserId, thoughtAuthorId }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles!comments_user_id_fkey(*)
      `)
      .eq('thought_id', thoughtId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }

    setComments(data as Comment[]);
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, thoughtId]);

  const handleSubmitComment = async () => {
    if (!currentUserId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to comment on this thought",
      });
      navigate('/auth', { state: { from: `/thought/${thoughtId}` } });
      return;
    }

    if (!newComment.trim()) return;

    const { error } = await supabase
      .from('comments')
      .insert({
        content: newComment,
        thought_id: thoughtId,
        user_id: currentUserId
      });

    if (error) {
      toast({
        title: "Error",
        description: "Could not post comment",
        variant: "destructive",
      });
      return;
    }

    // Create notification for thought author
    if (currentUserId !== thoughtAuthorId) {
      await supabase
        .from('notifications')
        .insert({
          type: 'comment',
          user_id: thoughtAuthorId,
          content: 'Someone commented on your thought',
          related_user_id: currentUserId,
          related_thought_id: thoughtId
        });
    }

    setNewComment("");
    fetchComments();
    toast({
      title: "Success",
      description: "Comment posted successfully",
    });
  };

  const handleDeleteComment = async (commentId: string, commentUserId: string) => {
    if (commentUserId !== currentUserId && thoughtAuthorId !== currentUserId) return;

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      toast({
        title: "Error",
        description: "Could not delete comment",
        variant: "destructive",
      });
      return;
    }

    fetchComments();
    toast({
      title: "Success",
      description: "Comment deleted successfully",
    });
  };

  return (
    <div className="mt-4">
      <Button
        variant="ghost"
        className="flex items-center gap-2"
        onClick={() => setShowComments(!showComments)}
      >
        <MessageCircle className="w-4 h-4" />
        <span>{comments.length} Comments</span>
      </Button>

      {showComments && (
        <div className="mt-4 space-y-4">
          {currentUserId ? (
            <div className="flex gap-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="resize-none"
              />
              <Button onClick={handleSubmitComment}>Post</Button>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-600 mb-2">Sign in to leave a comment</p>
              <Button
                variant="outline"
                onClick={() => navigate('/auth', { state: { from: `/thought/${thoughtId}` } })}
              >
                Sign In
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={comment.author.avatar_url || '/placeholder.svg'}
                      alt={comment.author.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <h4 className="font-medium">{comment.author.username}</h4>
                      <p className="text-sm text-gray-600">{comment.content}</p>
                    </div>
                  </div>
                  {(comment.user_id === currentUserId || thoughtAuthorId === currentUserId) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id, comment.user_id)}
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
