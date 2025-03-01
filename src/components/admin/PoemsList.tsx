
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import type { Thought } from "@/types";

export const PoemsList = () => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchThoughts = async () => {
    setIsLoading(true);
    try {
      const { data: thoughtsData, error } = await supabase
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
          ),
          likes:likes(count),
          comments:comments(count)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching thoughts:', error);
        toast({
          title: "Error",
          description: "Could not fetch thoughts",
          variant: "destructive",
        });
        return;
      }

      const enhancedThoughts = thoughtsData.map(thought => ({
        ...thought,
        author: thought.author as Thought['author'],
        _count: {
          likes: thought.likes?.[0]?.count || 0,
          bookmarks: 0 // Adding the missing bookmarks property
        }
      }));

      setThoughts(enhancedThoughts as Thought[]);
    } catch (error) {
      console.error('Unexpected error fetching thoughts:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThoughts();
  }, []);

  const handleDeleteThought = async () => {
    if (!selectedThoughtId) return;
    
    try {
      // First delete all related records that have foreign key constraints
      await Promise.all([
        supabase.from('likes').delete().eq('thought_id', selectedThoughtId),
        supabase.from('comments').delete().eq('thought_id', selectedThoughtId),
        supabase.from('bookmarks').delete().eq('thought_id', selectedThoughtId),
        supabase.from('thought_tags').delete().eq('thought_id', selectedThoughtId)
      ]);
      
      // Then delete the thought itself
      const { error } = await supabase
        .from('thoughts')
        .delete()
        .eq('id', selectedThoughtId);

      if (error) {
        console.error('Error deleting thought:', error);
        toast({
          title: "Error",
          description: "Could not delete thought: " + error.message,
          variant: "destructive",
        });
        return;
      }

      setThoughts(thoughts.filter(thought => thought.id !== selectedThoughtId));
      toast({
        title: "Success",
        description: "Thought deleted successfully",
      });
    } catch (error) {
      console.error('Unexpected error deleting thought:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedThoughtId(null);
    }
  };

  const handleDeleteClick = (thoughtId: string) => {
    setSelectedThoughtId(thoughtId);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Thoughts</h2>
        <Button 
          onClick={fetchThoughts} 
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Refresh Thoughts"}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {thoughts.map((thought) => (
          <Card key={thought.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl line-clamp-2">{thought.title}</CardTitle>
              <CardDescription className="flex items-center justify-between">
                <span>{thought.author?.full_name || thought.author?.username}</span>
                <span className="text-xs text-gray-500">
                  {format(new Date(thought.created_at), 'MMM d, yyyy')}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-gray-700 line-clamp-3 whitespace-pre-line">{thought.content}</p>
              
              {thought.image_url && (
                <div className="mt-2 h-32 overflow-hidden rounded-md">
                  <img 
                    src={thought.image_url} 
                    alt={thought.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <div className="flex gap-2">
                <Badge variant="outline" className="flex gap-1 items-center">
                  Likes: {thought._count?.likes || 0}
                </Badge>
                <Badge variant="outline" className="flex gap-1 items-center">
                  Comments: {thought._count?.likes || 0}
                </Badge>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleDeleteClick(thought.id)}
              >
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {thoughts.length === 0 && !isLoading && (
        <div className="text-center py-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">No thoughts found</p>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded-md w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-md w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
              </CardContent>
              <CardFooter>
                <div className="h-8 bg-gray-200 rounded-md w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this thought? This will also remove all associated likes, comments, and bookmarks.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteThought} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
