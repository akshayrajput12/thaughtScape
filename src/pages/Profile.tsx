
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InterestsSelector } from '@/components/profile/InterestsSelector';
import { ProfileForm } from "@/components/profile/ProfileForm";
import type { Profile, Thought } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Create components needed by Profile page
const PoemsList = ({ profileId }: { profileId: string }) => {
  return <div>User poems will be listed here</div>;
};

const BookmarkedPosts = ({ profileId }: { profileId: string }) => {
  return <div>Bookmarked posts will be listed here</div>;
};

const TaggedPosts = ({ profileId }: { profileId: string }) => {
  return <div>Tagged posts will be listed here</div>;
};

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { username } = useParams();
  const location = useLocation();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingFollowRequest, setIsSendingFollowRequest] = useState(false);
  const [postsCount, setPostsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    if (username) {
      fetchProfile(username);
    }
  }, [username, user]);

  const fetchProfile = async (username: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setIsOwnProfile(user?.id === data.id);
        await fetchFollowStatus(data.id);
        await fetchCounts(data.id);
      } else {
        toast({
          title: "Error",
          description: "Profile not found",
          variant: "destructive",
        });
        navigate('/home');
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowStatus = async (profileId: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', profileId)
        .single();

      setIsFollowing(!error && !!data);
    } catch (error) {
      console.error("Error fetching follow status:", error);
    }
  };

  const fetchCounts = async (profileId: string) => {
    try {
      const { data: followData, error: followError } = await supabase
        .from('follows')
        .select('*', { count: 'exact' })
        .eq('following_id', profileId);

      if (followError) throw followError;

      setFollowersCount(followData.length);

      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact' })
        .eq('follower_id', profileId);

      if (followingError) throw followingError;

      setFollowingCount(followingData.length);

      const { data: thoughtsData, error: thoughtsError } = await supabase
        .from('thoughts')
        .select('*', { count: 'exact' })
        .eq('author_id', profileId);

      if (thoughtsError) throw thoughtsError;

      setPostsCount(thoughtsData.length);
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  const handleFollow = async () => {
    if (!user || !profile) return;

    setIsSendingFollowRequest(true);
    try {
      const { error } = await supabase
        .from('follows')
        .insert([{ follower_id: user.id, following_id: profile.id }]);

      if (error) throw error;

      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
      toast({
        title: "Success",
        description: `You are now following ${profile.username}`,
      });
    } catch (error: any) {
      console.error("Error following user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to follow user",
        variant: "destructive",
      });
    } finally {
      setIsSendingFollowRequest(false);
    }
  };

  const handleUnfollow = async () => {
    if (!user || !profile) return;

    setIsSendingFollowRequest(true);
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.id);

      if (error) throw error;

      setIsFollowing(false);
      setFollowersCount(prev => prev - 1);
      toast({
        title: "Success",
        description: `You have unfollowed ${profile.username}`,
      });
    } catch (error: any) {
      console.error("Error unfollowing user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow user",
        variant: "destructive",
      });
    } finally {
      setIsSendingFollowRequest(false);
    }
  };

  const handleUpdateProfile = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
    setIsEditing(false);
  };

  const handleMessageClick = (profile: Profile) => {
    navigate(`/messages/${profile.id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto mt-10 p-6 bg-white shadow-md rounded-md">
        <div className="flex items-center space-x-6 mb-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full mt-4" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto mt-10 p-6 bg-white shadow-md rounded-md">
        <p className="text-red-500">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-10">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <ProfileHeader
          profile={profile}
          isFollowing={isFollowing}
          onFollowToggle={isFollowing ? handleUnfollow : handleFollow}
          followersCount={followersCount}
          followingCount={followingCount}
          postsCount={postsCount}
        />

        <Tabs defaultValue="posts" className="p-6">
          <TabsList className="mb-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>
            <TabsTrigger value="tagged">Tagged</TabsTrigger>
            {isOwnProfile && <TabsTrigger value="edit">Edit Profile</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="posts">
            <PoemsList profileId={profile.id} />
          </TabsContent>
          
          <TabsContent value="bookmarked">
            <BookmarkedPosts profileId={profile.id} />
          </TabsContent>

          <TabsContent value="tagged">
            <TaggedPosts profileId={profile.id} />
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="edit">
              <div className="p-4">
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              </div>
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                      Make changes to your profile here. Click save when you're done.
                    </DialogDescription>
                  </DialogHeader>
                  <ProfileForm profile={profile} onSubmitSuccess={handleUpdateProfile} />
                </DialogContent>
              </Dialog>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;
