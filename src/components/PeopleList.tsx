
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFollow } from "@/hooks/use-follow";
import { useNavigate } from "react-router-dom";
import { UserCheck, UserPlus } from "lucide-react";

export const PeopleList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});

  // Fetch suggested users
  const { data: users, isLoading } = useQuery({
    queryKey: ['suggested-users'],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .rpc('get_suggested_users', { user_id: user.id })
        .limit(10);

      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!user?.id,
  });

  // Initialize follow states from user data
  useEffect(() => {
    if (users) {
      const initialStates: Record<string, boolean> = {};
      users.forEach(profile => {
        initialStates[profile.id] = profile.is_following || false;
      });
      setFollowStates(initialStates);
    }
  }, [users]);

  const handleFollow = async (targetId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to follow users",
        variant: "destructive",
      });
      return;
    }

    const { isFollowing, toggleFollow } = useFollow(user.id, targetId, followStates[targetId] || false);

    try {
      await toggleFollow();
      // Update local state
      setFollowStates(prev => ({
        ...prev,
        [targetId]: !prev[targetId]
      }));
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    }
  };

  const handleProfileClick = (profileId: string) => {
    navigate(`/profile/${profileId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((profile) => (
        <div 
          key={profile.id}
          className="flex items-center justify-between p-4 bg-card hover:bg-card/80 border border-border hover:border-primary/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => handleProfileClick(profile.id)}
          >
            <Avatar className="h-12 w-12 border-2 border-background">
              <AvatarImage src={profile.avatar_url || ''} />
              <AvatarFallback>{profile.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{profile.full_name || profile.username}</p>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>
          </div>
          <Button
            variant={followStates[profile.id] ? "outline" : "default"}
            size="sm"
            className={followStates[profile.id] ? "border-primary/30 text-primary" : ""}
            onClick={() => handleFollow(profile.id)}
          >
            {followStates[profile.id] ? (
              <>
                <UserCheck className="mr-1 h-4 w-4" />
                Following
              </>
            ) : (
              <>
                <UserPlus className="mr-1 h-4 w-4" />
                Follow
              </>
            )}
          </Button>
        </div>
      ))}
    </div>
  );
};
