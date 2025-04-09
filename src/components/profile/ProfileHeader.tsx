import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, X, MessageSquare, UserPlus, UserMinus, ShieldAlert, Shield, AlertCircle, Search } from "lucide-react";
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
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile: boolean;
  isEditing: boolean;
  onEditClick: () => void;
  isFollowing?: boolean;
  isBlocked?: boolean;
  isBlockedByUser?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onBlock?: () => void;
  onUnblock?: () => void;
  onMessage?: () => void;
}

interface Genre {
  id: string;
  name: string;
}

export const ProfileHeader = ({ 
  profile, 
  isOwnProfile, 
  isEditing, 
  onEditClick,
  isFollowing = false,
  isBlocked = false,
  isBlockedByUser = false,
  onFollow,
  onUnfollow,
  onBlock,
  onUnblock,
  onMessage
}: ProfileHeaderProps) => {
  const [userGenres, setUserGenres] = useState<Genre[]>([]);
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

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
          description: "Failed to load interests",
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

  const filteredGenres = availableGenres
    .filter(genre => !userGenres.some(g => g.id === genre.id))
    .filter(genre => 
      searchQuery ? genre.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );

  return (
    <Card className="bg-white rounded-xl shadow-lg mb-8 border border-purple-100/50 backdrop-blur-sm w-full overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col items-center text-center md:flex-row md:items-start md:text-left gap-6">
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
          
          <div className="flex flex-col items-center md:items-start gap-1 flex-grow">
            <h1 className="text-2xl md:text-3xl font-bold">
              {profile.full_name || profile.username}
            </h1>
            <p className="text-gray-600 mb-2">@{profile.username}</p>
            
            {profile.bio && !isEditing && (
              <p className="text-gray-700 leading-relaxed max-w-2xl mt-2 text-center md:text-left">
                {profile.bio}
              </p>
            )}

            {!isOwnProfile && !isEditing && (
              <div className="flex flex-wrap gap-2 mt-4 w-full md:w-auto">
                {isBlockedByUser ? (
                  <div className="flex items-center gap-2 text-red-600 font-medium bg-red-50 px-4 py-2 rounded-lg w-full md:w-auto">
                    <AlertCircle size={16} />
                    <span>You've been blocked by this user</span>
                  </div>
                ) : (
                  <>
                    {isBlocked ? (
                      <Button 
                        variant="outline"
                        className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={onUnblock}
                      >
                        <Shield size={16} />
                        Unblock User
                      </Button>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline"
                            className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <ShieldAlert size={16} />
                            Block User
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Block {profile.username}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Blocking this user will prevent them from sending you messages or seeing your content.
                              They will not be notified that you've blocked them.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={onBlock}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Block User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </>
                )}
                
                {!isBlocked && !isBlockedByUser && (
                  <>
                    {isFollowing ? (
                      <Button 
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={onUnfollow}
                      >
                        <UserMinus size={16} />
                        Unfollow
                      </Button>
                    ) : (
                      <Button 
                        variant="default"
                        className="flex items-center gap-2"
                        onClick={onFollow}
                      >
                        <UserPlus size={16} />
                        Follow
                      </Button>
                    )}
                    <Button 
                      variant="secondary"
                      className="flex items-center gap-2"
                      onClick={onMessage}
                    >
                      <MessageSquare size={16} />
                      Message
                    </Button>
                  </>
                )}
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
                    <PopoverContent className="p-0 w-64" side="top" align="end">
                      <Command className="rounded-lg border shadow-md">
                        <div className="flex items-center border-b px-3">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <CommandInput 
                            placeholder="Search interests..." 
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        <CommandList>
                          <CommandEmpty>No interests found.</CommandEmpty>
                          <CommandGroup>
                            {filteredGenres.length > 0 ? (
                              filteredGenres.map(genre => (
                                <CommandItem
                                  key={genre.id}
                                  value={genre.name}
                                  onSelect={() => handleAddGenre(genre.id)}
                                  className="cursor-pointer"
                                >
                                  {genre.name}
                                </CommandItem>
                              ))
                            ) : (
                              <CommandItem disabled>
                                {searchQuery ? "No matching interests" : "Loading interests..."}
                              </CommandItem>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {userGenres && userGenres.length > 0 ? (
                  userGenres.map((genre) => (
                    <Badge 
                      key={genre.id}
                      variant="secondary" 
                      className="bg-purple-50 text-purple-700 hover:bg-purple-100 pl-3 pr-2 py-1 flex items-center gap-1 animate-in fade-in duration-300"
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
                  ))
                ) : (
                  <span className="text-sm text-gray-500 italic">No interests added yet</span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
