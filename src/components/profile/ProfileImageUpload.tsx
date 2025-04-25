import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { Profile } from "@/types";

interface ProfileImageUploadProps {
  profile: Profile;
  onImageUploaded: (url: string) => void;
}

export function ProfileImageUpload({ profile, onImageUploaded }: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > 2) {
      toast({
        title: "File too large",
        description: "Please select an image under 2MB",
        variant: "destructive",
      });
      return;
    }

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Create a preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setUploading(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("profile-images")
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(filePath);

      if (publicUrlData) {
        // Update the profile with the new avatar URL
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrlData.publicUrl })
          .eq("id", profile.id);

        if (updateError) {
          throw updateError;
        }

        onImageUploaded(publicUrlData.publicUrl);
        
        toast({
          title: "Success",
          description: "Profile image updated successfully",
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!profile.avatar_url) return;

    try {
      // Extract the file name from the URL
      const fileName = profile.avatar_url.split("/").pop();
      
      if (fileName) {
        // Remove from storage
        const { error: removeError } = await supabase.storage
          .from("profile-images")
          .remove([fileName]);

        if (removeError) {
          throw removeError;
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", profile.id);

      if (updateError) {
        throw updateError;
      }

      onImageUploaded("");
      setPreview(null);
      
      toast({
        title: "Success",
        description: "Profile image removed successfully",
      });
    } catch (error) {
      console.error("Error removing image:", error);
      toast({
        title: "Error",
        description: "Failed to remove profile image",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className="h-32 w-32 border-2 border-gray-200">
        <AvatarImage src={preview || profile.avatar_url || undefined} />
        <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={uploading}
          onClick={() => document.getElementById("profile-image-upload")?.click()}
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload Image"}
        </Button>

        {(profile.avatar_url || preview) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-red-500 hover:text-red-600"
            onClick={handleRemoveImage}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
            Remove
          </Button>
        )}

        <input
          id="profile-image-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      <p className="text-xs text-gray-500">Maximum file size: 2MB</p>
    </div>
  );
}
