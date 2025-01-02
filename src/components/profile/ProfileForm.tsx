import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
    const updates = {
      full_name: String(formData.get('full_name')),
      bio: String(formData.get('bio')),
      age: formData.get('age') ? parseInt(String(formData.get('age'))) : null,
      country: String(formData.get('country')),
      state: String(formData.get('state')),
      city: String(formData.get('city')),
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .single();

    if (error) {
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
      description: "Profile updated successfully",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <Input
          name="full_name"
          defaultValue={profile.full_name || ''}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Bio</label>
        <Textarea
          name="bio"
          defaultValue={profile.bio || ''}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
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
      <Button type="submit">Save Changes</Button>
    </form>
  );
};