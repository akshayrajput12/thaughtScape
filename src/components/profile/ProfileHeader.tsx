
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import type { Profile } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface UserGenreWithDetails {
  genre_id: string;
  genres: {
    id: string;
    name: string;
  };
}

export const ProfileHeader = ({ 
  profile, 
  isOwnProfile, 
  isEditing, 
  onEditClick 
}: ProfileHeaderProps) => {
  const [userGenres, setUserGenres] = useState<string[]>([]);
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
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

        // Fetch user's genres using a join
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
          const genreNames = userGenresData
            .filter((ug): ug is UserGenreWithDetails => 
              ug.genres !== null && typeof ug.genres.name === 'string'
            )
            .map(ug => ug.genres.name);
          setUserGenres(genreNames);
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
      const { error } = await supabase
        .from('user_genres')
        .insert({
          user_id: profile.id,
          genre_id: genreId
        });

      if (error) throw error;

      const selectedGenre = availableGenres.find(g => g.id === genreId);
      if (selectedGenre) {
        setUserGenres(prev => [...prev, selectedGenre.name]);
      }

      toast({
        title: "Success",
        description: "Genre added successfully",
      });
    } catch (error) {
      console.error('Error adding genre:', error);
      toast({
        title: "Error",
        description: "Failed to add genre",
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
              <h3 className="text-sm font-medium text-gray-700 mb-2">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {userGenres.map((genre) => (
                  <Badge 
                    key={genre}
                    variant="secondary" 
                    className="bg-purple-50 text-purple-700 hover:bg-purple-100"
                  >
                    {genre}
                  </Badge>
                ))}
                {isOwnProfile && (
                  <Select onValueChange={handleAddGenre}>
                    <SelectTrigger className="w-[140px] h-7">
                      <SelectValue placeholder="Add interest" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGenres
                        .filter(genre => !userGenres.includes(genre.name))
                        .map(genre => (
                          <SelectItem key={genre.id} value={genre.id}>
                            {genre.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
