import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  age: number;
  country: string;
  state: string;
  city: string;
}

interface Poem {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const Profile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const { toast } = useToast();

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

      const { data: poemsData } = await supabase
        .from('poems')
        .select('*')
        .eq('author_id', id)
        .order('created_at', { ascending: false });

      setPoems(poemsData || []);
    };

    fetchProfile();
  }, [id, toast]);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updates = {
      full_name: formData.get('full_name'),
      bio: formData.get('bio'),
      age: parseInt(formData.get('age') as string),
      country: formData.get('country'),
      state: formData.get('state'),
      city: formData.get('city'),
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile?.id);

    if (error) {
      toast({
        title: "Error",
        description: "Could not update profile",
        variant: "destructive",
      });
      return;
    }

    setIsEditing(false);
    setProfile(prev => ({ ...prev!, ...updates }));
    toast({
      title: "Success",
      description: "Profile updated successfully",
    });
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-serif font-bold">{profile.full_name || profile.username}</h1>
              <p className="text-gray-600">@{profile.username}</p>
            </div>
            {isOwnProfile && (
              <Button onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  name="full_name"
                  defaultValue={profile.full_name}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <textarea
                  name="bio"
                  defaultValue={profile.bio}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Age</label>
                  <input
                    name="age"
                    type="number"
                    defaultValue={profile.age}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <input
                    name="country"
                    defaultValue={profile.country}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    name="state"
                    defaultValue={profile.state}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    name="city"
                    defaultValue={profile.city}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <Button type="submit">Save Changes</Button>
            </form>
          ) : (
            <div className="space-y-4">
              {profile.bio && <p className="text-gray-700">{profile.bio}</p>}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {profile.age && <div><span className="font-medium">Age:</span> {profile.age}</div>}
                {profile.country && <div><span className="font-medium">Country:</span> {profile.country}</div>}
                {profile.state && <div><span className="font-medium">State:</span> {profile.state}</div>}
                {profile.city && <div><span className="font-medium">City:</span> {profile.city}</div>}
              </div>
            </div>
          )}
        </div>

        <Tabs defaultValue="poems" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="poems" className="flex-1">Poems</TabsTrigger>
            <TabsTrigger value="likes" className="flex-1">Likes</TabsTrigger>
            <TabsTrigger value="bookmarks" className="flex-1">Bookmarks</TabsTrigger>
          </TabsList>
          <TabsContent value="poems">
            <div className="space-y-6">
              {poems.map((poem) => (
                <div key={poem.id} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-serif font-semibold mb-2">{poem.title}</h3>
                  <p className="text-gray-700 whitespace-pre-line">{poem.content}</p>
                  <div className="mt-4 text-sm text-gray-500">
                    {new Date(poem.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
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
      </div>
    </div>
  );
};

export default Profile;