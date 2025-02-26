
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Upload } from "lucide-react";
import type { Profile } from "@/types";
import { Label } from "@/components/ui/label";

interface ProfileFormProps {
  profile: Profile;
  onSubmitSuccess: (profile: Profile) => void;
}

export const ProfileForm = ({ profile, onSubmitSuccess }: ProfileFormProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (3MB limit)
    if (file.size > 3 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 3MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile_images')
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile_images')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);

      toast({
        title: "Success",
        description: "Profile image uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const isProfileCompleted = Boolean(
      formData.get('username') && 
      formData.get('full_name') && 
      formData.get('bio')
    );

    const updates = {
      username: String(formData.get('username')),
      full_name: String(formData.get('full_name')),
      bio: String(formData.get('bio')),
      age: formData.get('age') ? parseInt(String(formData.get('age'))) : null,
      country: String(formData.get('country')),
      state: String(formData.get('state')),
      city: String(formData.get('city')),
      avatar_url: avatarUrl,
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
      <div className="flex flex-col items-center space-y-4 mb-6">
        <Avatar className="w-32 h-32 border-4 border-primary/20">
          <AvatarImage src={avatarUrl || undefined} alt={profile.full_name || profile.username} />
          <AvatarFallback>
            <User className="w-12 h-12 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-center gap-2">
          <Label htmlFor="image-upload" className="cursor-pointer">
            <div className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 transition-colors px-4 py-2 rounded-full">
              <Upload className="w-4 h-4" />
              <span>Upload Profile Picture</span>
            </div>
          </Label>
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
          <p className="text-sm text-muted-foreground">Max size: 3MB</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            defaultValue={profile.username || ''}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={profile.full_name || ''}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={profile.bio || ''}
          rows={3}
          className="mt-1 resize-none"
          placeholder="Tell us about yourself..."
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            name="age"
            type="number"
            defaultValue={profile.age || ''}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            defaultValue={profile.country || ''}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            defaultValue={profile.state || ''}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            defaultValue={profile.city || ''}
            className="mt-1"
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full md:w-auto"
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : "Save Changes"}
      </Button>
    </form>
  );
};
