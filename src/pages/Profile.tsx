import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfilePoems } from "@/components/profile/ProfilePoems";
import { ProfileForm } from "@/components/profile/ProfileForm";
import type { Profile, Poem } from "@/types";

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchProfileAndPoems = async () => {
      try {
        console.log("Fetching profile and poems for user:", id);
        setLoading(true);

        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUserId(session?.user?.id);

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          throw profileError;
        }

        if (!profileData) {
          toast({
            title: "Error",
            description: "Profile not found",
            variant: "destructive",
          });
          return;
        }

        setProfile(profileData);
        console.log("Fetched profile:", profileData);

        // Check if user is admin
        if (session?.user?.id) {
          const { data: adminData } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .maybeSingle();
          setIsAdmin(adminData?.is_admin || false);
        }

        // Fetch poems with author information
        const { data: poemsData, error: poemsError } = await supabase
          .from('poems')
          .select(`
            *,
            author:profiles!poems_author_id_fkey (
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

        if (poemsError) {
          console.error("Error fetching poems:", poemsError);
          throw poemsError;
        }

        console.log("Fetched poems:", poemsData);
        setPoems(poemsData);

      } catch (error) {
        console.error("Unexpected error:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfileAndPoems();
    }
  }, [id, toast]);

  const handleEditClick = () => {
    setIsEditing(!isEditing);
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
    setIsEditing(false);
    toast({
      title: "Success",
      description: "Profile updated successfully",
    });
  };

  const handleDeletePoem = async (poemId: string) => {
    try {
      const { error } = await supabase
        .from('poems')
        .delete()
        .eq('id', poemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Poem deleted successfully",
      });

      setPoems(poems.filter(poem => poem.id !== poemId));
    } catch (error) {
      console.error("Error deleting poem:", error);
      toast({
        title: "Error",
        description: "Failed to delete poem",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800">Profile not found</h1>
        <p className="text-gray-600">The requested profile could not be found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-primary/10 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <ProfileHeader 
          profile={profile} 
          isOwnProfile={currentUserId === profile.id}
          isEditing={isEditing}
          onEditClick={handleEditClick}
        />
        
        {isEditing ? (
          <ProfileForm 
            profile={profile} 
            onSubmitSuccess={handleProfileUpdate}
          />
        ) : (
          <>
            <ProfileStats 
              postsCount={profile.posts_count || 0}
              followersCount={profile.followers_count || 0}
              followingCount={profile.following_count || 0}
            />
            <ProfilePoems 
              poems={poems}
              isOwnProfile={currentUserId === profile.id}
              isAdmin={isAdmin}
              onDeletePoem={handleDeletePoem}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;