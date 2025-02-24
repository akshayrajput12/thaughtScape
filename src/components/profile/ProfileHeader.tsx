
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

interface UserGenreResponse {
  genre_id: string;
  genres: Genre | null;
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

        // Fetch user's genres
        const { data: userGenresData, error: userGenresError } = await supabase
          .from('user_genres')
          .select(`
            genre_id,
            genres (
              id,
              name
            )
          `)
          .eq('user_id', profile.id);

        if (userGenresError) throw userGenresError;
        if (userGenresData) {
          const validGenres = userGenresData
            .filter((ug): ug is UserGenreResponse & { genres: Genre } => 
              ug.genres !== null && 
              typeof ug.genres === 'object' &&
              'id' in ug.genres &&
              'name' in ug.genres
            )
            .map(ug => ug.genres);
          
          setUserGenres(validGenres);
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
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-purple-100/50 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <Avatar className="w-24 h-24 relative">
              <AvatarImage 
                src={profile.avatar_url || undefined} 
                alt={profile.full_name || profile.username}
                className="object-cover"
              />
              <AvatarFallback>
                <User className="w-10 h-10 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {profile.full_name || profile.username}
            </h1>
            <p className="text-gray-600 mb-2">@{profile.username}</p>
            {!isEditing && profile.bio && (
              <p className="text-gray-700 leading-relaxed max-w-2xl">{profile.bio}</p>
            )}
          </div>
        </div>
        {isOwnProfile && (
          <Button 
            onClick={onEditClick}
            variant={isEditing ? "outline" : "default"}
            className="transition-all duration-200 hover:scale-105 self-start"
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {!isEditing && (
          <>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
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
                          {availableGenres
                            .filter(genre => !userGenres.some(g => g.id === genre.id))
                            .map(genre => (
                              <CommandItem
                                key={genre.id}
                                value={genre.name}
                                onSelect={() => handleAddGenre(genre.id)}
                              >
                                {genre.name}
                              </CommandItem>
                            ))}
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
          </>
        )}
      </div>
    </div>
  );
};
