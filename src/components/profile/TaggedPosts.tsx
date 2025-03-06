
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Tag, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PoemCard } from "@/components/PoemCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Thought } from "@/types";

interface TaggedPostsProps {
  userId: string;
  currentUserId: string | null;
}

export const TaggedPosts = ({ userId, currentUserId }: TaggedPostsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [taggedPosts, setTaggedPosts] = useState<Thought[]>([]);
  const [pendingTags, setPendingTags] = useState<Thought[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchTaggedPosts();
  }, [userId]);
  
  const fetchTaggedPosts = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, you would have a table for tags and query that
      // For this example, we'll just fetch thoughts that mention the user
      // This is a placeholder implementation
      const { data, error } = await supabase
        .from('thoughts')
        .select(`
          *,
          author:profiles!thoughts_author_id_fkey(*)
        `)
        .or(`content.ilike.%@${userId}%,content.ilike.%@${userId.substring(0, 8)}%`)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // In a real implementation, you would filter based on accepted/pending tags
      // For now, we'll just display all as accepted
      setTaggedPosts(data || []);
      setPendingTags([]);
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
    // This would update your tagging system to mark the tag as accepted
    toast({
      title: "Success",
      description: "Tag accepted successfully",
    });
    fetchTaggedPosts();
  };
  
  const handleRejectTag = async (thoughtId: string) => {
    // This would update your tagging system to remove the tag
    toast({
      title: "Success",
      description: "Tag rejected successfully",
    });
    fetchTaggedPosts();
  };
  
  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-6">
        <Tag className="h-5 w-5 text-purple-600" />
        <h2 className="text-2xl font-serif font-bold text-black">Tagged Posts</h2>
      </div>
      
      <Tabs defaultValue="accepted" className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="accepted" className="px-4">
            Accepted
          </TabsTrigger>
          <TabsTrigger value="pending" className="px-4">
            Pending
            {pendingTags.length > 0 && (
              <span className="ml-2 bg-purple-600 text-white text-xs rounded-full px-2 py-0.5">
                {pendingTags.length}
              </span>
            )}
          </TabsTrigger>
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
              <Tag className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-600">No tagged posts yet</h3>
              <p className="text-gray-500 mt-2">When someone tags you in a post and you accept it, it will appear here.</p>
            </div>
          )}
        </TabsContent>
        
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
                      src={thought.author.avatar_url || "/placeholder.svg"} 
                      alt={thought.author.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">{thought.author.username}</p>
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
              <Tag className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-600">No pending tags</h3>
              <p className="text-gray-500 mt-2">When someone tags you in a post, it will appear here for your approval.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
