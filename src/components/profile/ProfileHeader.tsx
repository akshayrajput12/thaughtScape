
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, X } from "lucide-react";
import type { Profile } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile: boolean;
  isEditing: boolean;
  onEditClick: () => void;
}

interface Genre {
  id: string;
  name: string;
}

export const ProfileHeader = ({ 
  profile, 
  isOwnProfile, 
  isEditing, 
  onEditClick 
}: ProfileHeaderProps) => {
  const [userGenres, setUserGenres] = useState<Genre[]>([]);
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        // Fetch available genres
        const { data: genres, error: genresError } = await supabase
          .from('genres')
          .select('id, name')
          .order('name');
        
        if (genresError) throw genresError;
        if (genres) {
          setAvailableGenres(genres);
        }

        // Fetch user's genres with a different approach
        const { data: userGenresData, error: userGenresError } = await supabase
          .from('user_genres')
          .select('genre_id')
          .eq('user_id', profile.id);

        if (userGenresError) throw userGenresError;
        
        if (userGenresData && userGenresData.length > 0) {
          // Get the genre details for each user genre
          const genreIds = userGenresData.map(ug => ug.genre_id);
          const { data: genreDetails, error: genreDetailsError } = await supabase
            .from('genres')
            .select('id, name')
            .in('id', genreIds);

          if (genreDetailsError) throw genreDetailsError;
          
          if (genreDetails) {
            setUserGenres(genreDetails);
          }
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
        toast({
          title: "Error",
          description: "Failed to load genres",
          variant: "destructive",
        });
      }
    };

    fetchGenres();
  }, [profile.id, toast]);

  const handleAddGenre = async (genreId: string) => {
    try {
      const selectedGenre = availableGenres.find(g => g.id === genreId);
      if (!selectedGenre) return;

      const { error } = await supabase
        .from('user_genres')
        .insert({
          user_id: profile.id,
          genre_id: genreId
        });

      if (error) throw error;

      setUserGenres(prev => [...prev, selectedGenre]);
      setOpen(false);

      toast({
        title: "Success",
        description: "Interest added successfully",
      });
    } catch (error) {
      console.error('Error adding genre:', error);
      toast({
        title: "Error",
        description: "Failed to add interest",
        variant: "destructive",
      });
    }
  };

  const handleRemoveGenre = async (genreId: string) => {
    try {
      const { error } = await supabase
        .from('user_genres')
        .delete()
        .eq('user_id', profile.id)
        .eq('genre_id', genreId);

      if (error) throw error;

      setUserGenres(prev => prev.filter(g => g.id !== genreId));
      toast({
        title: "Success",
        description: "Interest removed successfully",
      });
    } catch (error) {
      console.error('Error removing genre:', error);
      toast({
        title: "Error",
        description: "Failed to remove interest",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8 border border-purple-100/50 backdrop-blur-sm w-full">
      <div className="flex flex-col items-center text-center md:items-start md:text-left gap-6">
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
          <Avatar className="w-24 h-24 md:w-28 md:h-28 relative border-2 border-white shadow-md">
            <AvatarImage 
              src={profile.avatar_url || undefined} 
              alt={profile.full_name || profile.username}
              className="object-cover"
            />
            <AvatarFallback>
              <User className="w-10 h-10 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          
          {isOwnProfile && !isEditing && (
            <Button 
              onClick={onEditClick}
              variant="outline"
              size="sm"
              className="absolute bottom-0 right-0 rounded-full bg-white shadow"
            >
              Edit
            </Button>
          )}
        </div>
        
        <div className="flex flex-col items-center md:items-start gap-1">
          <h1 className="text-2xl md:text-3xl font-bold">
            {profile.full_name || profile.username}
          </h1>
          <p className="text-gray-600 mb-2">@{profile.username}</p>
          
          {profile.bio && !isEditing && (
            <p className="text-gray-700 leading-relaxed max-w-2xl mt-2 text-center md:text-left">
              {profile.bio}
            </p>
          )}
          
          {/* Stories highlight section like in the reference image */}
          {!isEditing && (
            <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                    {i === 0 && <span className="text-gray-500 text-2xl">+</span>}
                  </div>
                  <span className="text-xs text-gray-600">
                    {i === 0 ? 'New' : ['Poems', 'Life', 'Art', 'Travel'][i-1]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 justify-center md:justify-start">
            {profile.city && profile.country && (
              <span className="flex items-center gap-1 px-3 py-1 bg-gray-50 rounded-full">
                📍 {profile.city}, {profile.country}
              </span>
            )}
            {profile.age && (
              <span className="flex items-center gap-1 px-3 py-1 bg-gray-50 rounded-full">
                🎂 {profile.age} years old
              </span>
            )}
          </div>

          <div className="border-t border-purple-100/50 pt-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Interests</h3>
              {isOwnProfile && (
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      Add interests
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" side="right" align="start">
                    <Command>
                      <CommandInput placeholder="Search interests..." />
                      <CommandEmpty>No interests found.</CommandEmpty>
                      <CommandGroup>
                        {availableGenres && availableGenres.length > 0 ? (
                          availableGenres
                            .filter(genre => !userGenres?.some(g => g.id === genre.id))
                            .map(genre => (
                              <CommandItem
                                key={genre.id}
                                value={genre.name}
                                onSelect={() => handleAddGenre(genre.id)}
                              >
                                {genre.name}
                              </CommandItem>
                            ))
                        ) : null}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {userGenres.map((genre) => (
                <Badge 
                  key={genre.id}
                  variant="secondary" 
                  className="bg-purple-50 text-purple-700 hover:bg-purple-100 pl-3 pr-2 py-1 flex items-center gap-1"
                >
                  {genre.name}
                  {isOwnProfile && (
                    <button
                      onClick={() => handleRemoveGenre(genre.id)}
                      className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
