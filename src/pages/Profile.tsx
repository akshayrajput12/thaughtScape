import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfilePoems } from "@/components/profile/ProfilePoems";
import type { Profile as ProfileType, Poem } from "@/types";

const Profile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [session, setSession] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const isOwn = session?.user?.id === id;
      setIsOwnProfile(isOwn);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) {
        toast({
          title: "Error",
          description: "Could not load profile",
          variant: "destructive",
        });
        return;
      }

      setProfile(profileData);

      const { data: poemsData, error: poemsError } = await supabase
        .from('poems')
        .select(`
          *,
          author:profiles(
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
        toast({
          title: "Error",
          description: "Could not load poems",
          variant: "destructive",
        });
        return;
      }

      setPoems(poemsData as Poem[]);
    };

    fetchProfile();
  }, [id, toast]);

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <ProfileHeader 
          profile={profile}
          isOwnProfile={isOwnProfile}
          isEditing={isEditing}
          onEditClick={() => setIsEditing(!isEditing)}
        />

        {isEditing ? (
          <ProfileForm 
            profile={profile}
            onSubmitSuccess={(updatedProfile) => {
              setProfile(updatedProfile);
              setIsEditing(false);
            }}
          />
        ) : (
          <Tabs defaultValue="poems" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="poems" className="flex-1">Poems</TabsTrigger>
              <TabsTrigger value="likes" className="flex-1">Likes</TabsTrigger>
              <TabsTrigger value="bookmarks" className="flex-1">Bookmarks</TabsTrigger>
            </TabsList>
            <TabsContent value="poems">
              <ProfilePoems poems={poems} />
            </TabsContent>
            <TabsContent value="likes">
              <div className="text-center py-8 text-gray-500">
                Liked poems will appear here
              </div>
            </TabsContent>
            <TabsContent value="bookmarks">
              <div className="text-center py-8 text-gray-500">
                Bookmarked poems will appear here
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Profile;