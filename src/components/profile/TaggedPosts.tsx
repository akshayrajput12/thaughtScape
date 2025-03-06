
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tag as TagIcon, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PoemCard } from "@/components/PoemCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Thought, Tag } from "@/types";

interface TaggedPostsProps {
  userId: string;
  currentUserId: string | null;
}

export const TaggedPosts = ({ userId, currentUserId }: TaggedPostsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [taggedPosts, setTaggedPosts] = useState<Thought[]>([]);
  const [pendingTags, setPendingTags] = useState<Thought[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchTaggedPosts();
  }, [userId]);
  
  const fetchTaggedPosts = async () => {
    setIsLoading(true);
    try {
      // Fetch tags for this user
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('id, user_id, thought_id, status, created_at')
        .eq('user_id', userId);
        
      if (tagsError) {
        console.error('Error fetching tags:', tagsError);
        throw tagsError;
      }
      
      if (!tagsData || tagsData.length === 0) {
        setTaggedPosts([]);
        setPendingTags([]);
        setIsLoading(false);
        return;
      }
      
      // Get all thoughts where this user is tagged
      const acceptedTagsIds = tagsData
        .filter(tag => tag.status === 'accepted')
        .map(tag => tag.thought_id);
        
      const pendingTagsIds = tagsData
        .filter(tag => tag.status === 'pending')
        .map(tag => tag.thought_id);
      
      // Fetch accepted thoughts
      if (acceptedTagsIds.length > 0) {
        const { data: acceptedThoughts, error: acceptedError } = await supabase
          .from('thoughts')
          .select(`
            *,
            author:profiles!thoughts_author_id_fkey(
              id,
              username,
              full_name,
              avatar_url,
              created_at,
              updated_at
            )
          `)
          .in('id', acceptedTagsIds);
          
        if (acceptedError) {
          console.error('Error fetching accepted thoughts:', acceptedError);
          throw acceptedError;
        }
        
        setTaggedPosts(acceptedThoughts as Thought[] || []);
      } else {
        setTaggedPosts([]);
      }
      
      // Fetch pending thoughts (only for the user viewing their own profile)
      if (pendingTagsIds.length > 0 && userId === currentUserId) {
        const { data: pendingThoughts, error: pendingError } = await supabase
          .from('thoughts')
          .select(`
            *,
            author:profiles!thoughts_author_id_fkey(
              id,
              username,
              full_name,
              avatar_url,
              created_at,
              updated_at
            )
          `)
          .in('id', pendingTagsIds);
          
        if (pendingError) {
          console.error('Error fetching pending thoughts:', pendingError);
          throw pendingError;
        }
        
        setPendingTags(pendingThoughts as Thought[] || []);
      } else {
        setPendingTags([]);
      }
    } catch (error) {
      console.error('Error fetching tagged posts:', error);
      toast({
        title: "Error",
        description: "Failed to load tagged posts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAcceptTag = async (thoughtId: string) => {
    try {
      // Update tag status to accepted
      const { error } = await supabase
        .from('tags')
        .update({ status: 'accepted' })
        .eq('thought_id', thoughtId)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Create notification for the author
      const taggedThought = pendingTags.find(thought => thought.id === thoughtId);
      if (taggedThought) {
        await supabase
          .from('notifications')
          .insert({
            user_id: taggedThought.author_id,
            type: 'tag',
            content: `${userId} accepted your tag in "${taggedThought.title}"`,
            related_user_id: userId,
            related_thought_id: thoughtId,
            tag_status: 'accepted'
          });
      }
      
      toast({
        title: "Success",
        description: "Tag accepted successfully",
      });
      
      // Move the thought from pending to accepted
      const thought = pendingTags.find(t => t.id === thoughtId);
      if (thought) {
        setTaggedPosts(prev => [...prev, thought]);
        setPendingTags(prev => prev.filter(t => t.id !== thoughtId));
      }
    } catch (error) {
      console.error('Error accepting tag:', error);
      toast({
        title: "Error",
        description: "Failed to accept tag",
        variant: "destructive",
      });
    }
  };
  
  const handleRejectTag = async (thoughtId: string) => {
    try {
      // Update tag status to rejected
      const { error } = await supabase
        .from('tags')
        .update({ status: 'rejected' })
        .eq('thought_id', thoughtId)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Create notification for the author
      const taggedThought = pendingTags.find(thought => thought.id === thoughtId);
      if (taggedThought) {
        await supabase
          .from('notifications')
          .insert({
            user_id: taggedThought.author_id,
            type: 'tag',
            content: `${userId} rejected your tag in "${taggedThought.title}"`,
            related_user_id: userId,
            related_thought_id: thoughtId,
            tag_status: 'rejected'
          });
      }
      
      toast({
        title: "Success",
        description: "Tag rejected successfully",
      });
      
      // Remove the thought from pending
      setPendingTags(prev => prev.filter(t => t.id !== thoughtId));
    } catch (error) {
      console.error('Error rejecting tag:', error);
      toast({
        title: "Error",
        description: "Failed to reject tag",
        variant: "destructive",
      });
    }
  };
  
  // Only show the pending tab for the current user
  const isOwnProfile = userId === currentUserId;
  
  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-6">
        <TagIcon className="h-5 w-5 text-purple-600" />
        <h2 className="text-2xl font-serif font-bold text-black">Tagged Posts</h2>
      </div>
      
      <Tabs defaultValue="accepted" className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="accepted" className="px-4">
            Accepted
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="pending" className="px-4">
              Pending
              {pendingTags.length > 0 && (
                <span className="ml-2 bg-purple-600 text-white text-xs rounded-full px-2 py-0.5">
                  {pendingTags.length}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="accepted">
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-md">
                  <div className="flex items-center space-x-4 mb-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-24 w-full" />
                </div>
              ))}
            </div>
          ) : taggedPosts.length > 0 ? (
            <div className="grid gap-6">
              {taggedPosts.map((thought, index) => (
                <motion.div
                  key={thought.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PoemCard
                    poem={thought}
                    currentUserId={currentUserId}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <TagIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-600">No tagged posts yet</h3>
              <p className="text-gray-500 mt-2">When someone tags you in a post and you accept it, it will appear here.</p>
            </div>
          )}
        </TabsContent>
        
        {isOwnProfile && (
          <TabsContent value="pending">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingTags.length > 0 ? (
              <div className="space-y-4">
                {pendingTags.map((thought, index) => (
                  <motion.div
                    key={thought.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={thought.author?.avatar_url || "/placeholder.svg"} 
                        alt={thought.author?.username || "Unknown"}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium">{thought.author?.username || "Unknown"}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">Tagged you in: "{thought.title}"</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAcceptTag(thought.id)}
                        className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleRejectTag(thought.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <TagIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-600">No pending tags</h3>
                <p className="text-gray-500 mt-2">When someone tags you in a post, it will appear here for your approval.</p>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
