import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { FollowButton } from "@/components/profile/FollowButton";
import { MessageButton } from "@/components/profile/MessageButton";
import { InterestsSelector } from "@/components/profile/InterestsSelector";
import { ProfileForm } from "@/components/profile/ProfileForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Profile, Thought } from "@/types";
import { PoemsList } from "@/components/profile/ProfilePoems";
import { BookmarkedPosts } from "@/components/profile/BookmarkedPosts";
import { TaggedPosts } from "@/components/profile/TaggedPosts";

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { username } = router.query;

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

  useEffect(() => {
    if (username) {
      fetchProfile(username as string);
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
        router.push('/home');
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
    router.push(`/messages/${profile.id}`);
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
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
          isSendingFollowRequest={isSendingFollowRequest}
          postsCount={postsCount}
          followersCount={followersCount}
          followingCount={followingCount}
          isOwnProfile={isOwnProfile}  // Add this prop
          onMessage={() => handleMessageClick(profile)}
        />

        <ProfileTabs>
          <div label="Posts">
            <PoemsList profileId={profile.id} />
          </div>
          
          <div label="Bookmarked">
            <BookmarkedPosts profileId={profile.id} />
          </div>

          <div label="Tagged">
            <TaggedPosts profileId={profile.id} />
          </div>

          {isOwnProfile && (
            <div label="Edit Profile">
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
            </div>
          )}
        </ProfileTabs>
      </div>
    </div>
  );
};

export default ProfilePage;
