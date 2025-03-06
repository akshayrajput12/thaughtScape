
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase, blockUser, unblockUser, isUserBlocked, isBlockedBy } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfilePoems } from "@/components/profile/ProfilePoems";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { TaggedPosts } from "@/components/profile/TaggedPosts";
import type { Profile, Thought } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedByUser, setIsBlockedByUser] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Check if the current user is following the profile being viewed
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user?.id || !id) return;
      
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', id)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking follow status:', error);
        return;
      }
      
      setIsFollowing(!!data);
    };
    
    checkFollowStatus();
  }, [user?.id, id]);

  // Check if the current user has blocked or is blocked by the profile being viewed
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!user?.id || !id) return;
      
      const blocked = await isUserBlocked(id);
      setIsBlocked(blocked);
      
      const blockedBy = await isBlockedBy(id);
      setIsBlockedByUser(blockedBy);
    };
    
    checkBlockStatus();
  }, [user?.id, id]);

  // Fetch profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fetch thoughts (poems) for the profile
  const { data: thoughtsData, isLoading: thoughtsLoading } = useQuery({
    queryKey: ['thoughts', id],
    queryFn: async () => {
      const { data, error } = await supabase
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
          )
        `)
        .eq('author_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Check if the current user is an admin
  const { data: adminData } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user?.id) return { is_admin: false };
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Check if this is the first time the user is setting up their profile
  const showFirstTimeProfileForm = user?.id === id && 
                                  profileData && 
                                  !profileData.is_profile_completed;

  const handleEditClick = () => {
    setIsEditing(!isEditing);
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
    queryClient.setQueryData(['profile', id], updatedProfile);
    setIsEditing(false);
    toast({
      title: "Success",
      description: "Profile updated successfully",
    });
  };

  const handleDeleteThought = async (thoughtId: string) => {
    try {
      const { error } = await supabase
        .from('thoughts')
        .delete()
        .eq('id', thoughtId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Thought deleted successfully",
      });

      // Update local state
      queryClient.setQueryData(['thoughts', id], (oldData: Thought[] | undefined) => 
        oldData ? oldData.filter(thought => thought.id !== thoughtId) : []
      );
      
      // Update the post count
      if (profileData) {
        const updatedProfile = {
          ...profileData,
          posts_count: Math.max(0, (profileData.posts_count || 0) - 1)
        };
        queryClient.setQueryData(['profile', id], updatedProfile);
      }
    } catch (error) {
      console.error("Error deleting thought:", error);
      toast({
        title: "Error",
        description: "Failed to delete thought",
        variant: "destructive",
      });
    }
  };

  const handleFollow = async () => {
    if (!user?.id || !id) return;
    
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: id });
        
      if (error) throw error;
      
      setIsFollowing(true);
      
      // Update followers count in the profile data
      if (profileData) {
        const updatedProfile = {
          ...profileData,
          followers_count: (profileData.followers_count || 0) + 1
        };
        queryClient.setQueryData(['profile', id], updatedProfile);
      }
      
      // Invalidate queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['profile', id] });
      
      toast({
        title: "Success",
        description: `You are now following ${profileData?.username || 'this user'}`,
      });
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    }
  };
  
  const handleUnfollow = async () => {
    if (!user?.id || !id) return;
    
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', id);
        
      if (error) throw error;
      
      setIsFollowing(false);
      
      // Update followers count in the profile data
      if (profileData) {
        const updatedProfile = {
          ...profileData,
          followers_count: Math.max(0, (profileData.followers_count || 0) - 1)
        };
        queryClient.setQueryData(['profile', id], updatedProfile);
      }
      
      // Invalidate queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['profile', id] });
      
      toast({
        title: "Success",
        description: `You have unfollowed ${profileData?.username || 'this user'}`,
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    }
  };

  const handleBlockUser = async () => {
    if (!user?.id || !id) return;
    
    try {
      const result = await blockUser(id);
      
      if (!result.success) throw new Error(result.error);
      
      setIsBlocked(true);
      
      // If blocking, also unfollow
      if (isFollowing) {
        await handleUnfollow();
      }
      
      toast({
        title: "User Blocked",
        description: `You have blocked ${profileData?.username || 'this user'}`,
      });
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({
        title: "Error",
        description: "Failed to block user",
        variant: "destructive",
      });
    }
  };
  
  const handleUnblockUser = async () => {
    if (!user?.id || !id) return;
    
    try {
      const result = await unblockUser(id);
      
      if (!result.success) throw new Error(result.error);
      
      setIsBlocked(false);
      
      toast({
        title: "User Unblocked",
        description: `You have unblocked ${profileData?.username || 'this user'}`,
      });
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast({
        title: "Error",
        description: "Failed to unblock user",
        variant: "destructive",
      });
    }
  };

  const handleMessage = () => {
    if (!id) return;
    navigate(`/messages?user=${id}`);
  };

  if (profileLoading || thoughtsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-[#E5DEFF]/20 to-[#FDE1D3]/20">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E5DEFF] border-t-transparent shadow-lg"></div>
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#E5DEFF]/20 to-[#FDE1D3]/20 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white via-[#E5DEFF]/20 to-[#FDE1D3]/20">
        <div className="text-center p-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl transform transition-all duration-500 hover:scale-105">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#2D3748] to-[#6B7280] bg-clip-text text-transparent mb-4">Profile not found</h1>
          <p className="text-gray-600 animate-fadeIn">The requested profile could not be found.</p>
        </div>
      </div>
    );
  }

  const shouldShowForm = showFirstTimeProfileForm || isEditing;

  // Make sure counts match actual data
  const postsCount = (thoughtsData?.length || 0);
  
  // Update profile counts if needed before rendering
  if (profileData.posts_count !== postsCount && !isEditing) {
    const updatedProfile = {
      ...profileData,
      posts_count: postsCount
    };
    queryClient.setQueryData(['profile', id], updatedProfile);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#E5DEFF]/20 to-[#FDE1D3]/20 px-4 py-12 transition-all duration-500">
      <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn">
        <ProfileHeader 
          profile={profileData} 
          isOwnProfile={user?.id === profileData.id}
          isEditing={shouldShowForm}
          onEditClick={handleEditClick}
          isFollowing={isFollowing}
          isBlocked={isBlocked}
          isBlockedByUser={isBlockedByUser}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
          onBlock={handleBlockUser}
          onUnblock={handleUnblockUser}
          onMessage={handleMessage}
        />
        
        {shouldShowForm ? (
          <div className={showFirstTimeProfileForm ? "animate-scale-in" : ""}>
            <div className={showFirstTimeProfileForm ? "mb-6 p-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg shadow-sm" : "hidden"}>
              <h2 className="text-2xl font-bold text-purple-800 mb-3">Welcome to ThoughtScape!</h2>
              <p className="text-gray-700">Please complete your profile to get started. This will help others connect with you and personalize your experience.</p>
            </div>
            <ProfileForm 
              profile={profileData} 
              onSubmitSuccess={handleProfileUpdate}
              isFirstTimeSetup={showFirstTimeProfileForm}
            />
          </div>
        ) : (
          <>
            <ProfileStats 
              postsCount={postsCount}
              followersCount={profileData.followers_count || 0}
              followingCount={profileData.following_count || 0}
              userId={profileData.id}
            />
            
            <Tabs defaultValue="posts" className="mt-10">
              <TabsList className="mb-6">
                <TabsTrigger value="posts" onClick={() => setActiveTab("posts")}>
                  My Thoughts
                </TabsTrigger>
                <TabsTrigger value="tagged" onClick={() => setActiveTab("tagged")}>
                  Tagged Posts
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="posts">
                <ProfilePoems 
                  poems={thoughtsData || []} 
                  isOwnProfile={user?.id === profileData.id}
                  isAdmin={adminData?.is_admin || false}
                  onDeletePoem={handleDeleteThought}
                />
              </TabsContent>
              
              <TabsContent value="tagged">
                <TaggedPosts 
                  userId={profileData.id}
                  currentUserId={user?.id || null}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
