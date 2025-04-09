
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InterestsSelectorProps {
  userId: string;
  initialInterests?: string[];
  onUpdate?: (interests: string[]) => void;
}

export const InterestsSelector: React.FC<InterestsSelectorProps> = ({ 
  userId,
  initialInterests = [],
  onUpdate
}) => {
  const [interests, setInterests] = useState<string[]>(initialInterests);
  const [newInterest, setNewInterest] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (initialInterests && initialInterests.length > 0) {
      setInterests(initialInterests);
    } else {
      fetchInterests();
    }
  }, [initialInterests, userId]);

  const fetchInterests = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('genres')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (data?.genres) {
        setInterests(data.genres);
      }
    } catch (error) {
      console.error('Error fetching interests:', error);
    }
  };

  const handleAddInterest = async () => {
    if (!newInterest.trim()) return;
    
    // Prevent duplicates
    if (interests.includes(newInterest.trim())) {
      toast({
        title: "Interest already exists",
        description: "This interest is already in your list",
        variant: "destructive"
      });
      return;
    }
    
    const updatedInterests = [...interests, newInterest.trim()];
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ genres: updatedInterests })
        .eq('id', userId);
      
      if (error) throw error;
      
      setInterests(updatedInterests);
      setNewInterest("");
      
      if (onUpdate) {
        onUpdate(updatedInterests);
      }
      
      toast({
        title: "Interest added",
        description: `"${newInterest.trim()}" has been added to your interests`,
      });
    } catch (error) {
      console.error('Error adding interest:', error);
      toast({
        title: "Failed to add interest",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleRemoveInterest = async (interestToRemove: string) => {
    const updatedInterests = interests.filter(interest => interest !== interestToRemove);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ genres: updatedInterests })
        .eq('id', userId);
      
      if (error) throw error;
      
      setInterests(updatedInterests);
      
      if (onUpdate) {
        onUpdate(updatedInterests);
      }
      
      toast({
        title: "Interest removed",
        description: `"${interestToRemove}" has been removed from your interests`,
      });
    } catch (error) {
      console.error('Error removing interest:', error);
      toast({
        title: "Failed to remove interest",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {interests.map((interest) => (
          <div 
            key={interest}
            className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full flex items-center gap-1 text-sm"
          >
            <span>{interest}</span>
            <button
              onClick={() => handleRemoveInterest(interest)}
              className="text-indigo-500 hover:text-indigo-700 transition-colors"
              aria-label={`Remove ${interest}`}
            >
              <X size={16} />
            </button>
          </div>
        ))}
        {interests.length === 0 && (
          <p className="text-gray-500 text-sm">No interests added yet</p>
        )}
      </div>
      
      <div className="flex gap-2 mt-3">
        <Input
          placeholder="Add a new interest..."
          value={newInterest}
          onChange={(e) => setNewInterest(e.target.value)}
          className="flex-1"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddInterest();
            }
          }}
        />
        <Button 
          onClick={handleAddInterest}
          size="sm"
          className="flex-shrink-0"
        >
          <Plus size={16} className="mr-1" /> Add
        </Button>
      </div>
    </div>
  );
};
