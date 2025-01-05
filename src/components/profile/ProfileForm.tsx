import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import type { Profile } from "@/types";

interface ProfileFormProps {
  profile: Profile;
  onSubmitSuccess: (profile: Profile) => void;
}

export const ProfileForm = ({ profile, onSubmitSuccess }: ProfileFormProps) => {
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Check if required fields are filled
    const username = formData.get('username');
    const fullName = formData.get('full_name');
    const bio = formData.get('bio');
    
    const isProfileCompleted = Boolean(
      username && 
      fullName && 
      bio
    );

    const updates = {
      username: String(username),
      full_name: String(fullName),
      bio: String(bio),
      age: formData.get('age') ? parseInt(String(formData.get('age'))) : null,
      country: String(formData.get('country')),
      state: String(formData.get('state')),
      city: String(formData.get('city')),
      avatar_url: String(formData.get('avatar_url')),
      is_profile_completed: isProfileCompleted,
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Could not update profile",
        variant: "destructive",
      });
      return;
    }

    onSubmitSuccess(data);
    toast({
      title: "Success",
      description: isProfileCompleted 
        ? "Profile completed and updated successfully"
        : "Profile updated successfully",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center space-x-4 mb-6">
        <Avatar className="w-20 h-20">
          <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || profile.username} />
          <AvatarFallback>
            <User className="w-8 h-8 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Profile Image URL</label>
          <Input
            name="avatar_url"
            defaultValue={profile.avatar_url || ''}
            placeholder="Enter image URL"
            className="max-w-md"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <Input
            name="username"
            defaultValue={profile.username || ''}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <Input
            name="full_name"
            defaultValue={profile.full_name || ''}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Bio</label>
        <Textarea
          name="bio"
          defaultValue={profile.bio || ''}
          rows={3}
          className="resize-none"
          placeholder="Tell us about yourself..."
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Age</label>
          <Input
            name="age"
            type="number"
            defaultValue={profile.age || ''}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Country</label>
          <Input
            name="country"
            defaultValue={profile.country || ''}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">State</label>
          <Input
            name="state"
            defaultValue={profile.state || ''}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <Input
            name="city"
            defaultValue={profile.city || ''}
          />
        </div>
      </div>

      <Button type="submit" className="w-full md:w-auto">Save Changes</Button>
    </form>
  );
};