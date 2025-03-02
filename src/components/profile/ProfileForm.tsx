
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfileFormProps {
  profile: Profile;
  onSubmitSuccess: (profile: Profile) => void;
  isFirstTimeSetup?: boolean;
}

const collegeOptions = [
  "Lovely Professional University",
  "Delhi University",
  "IIT Delhi",
  "Chandigarh University",
  "Amity University",
  "Other"
];

export const ProfileForm = ({ profile, onSubmitSuccess, isFirstTimeSetup = false }: ProfileFormProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [selectedCollege, setSelectedCollege] = useState(profile.college || "");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = (formData: FormData) => {
    const errors: Record<string, string> = {};
    
    // Check required fields
    if (!formData.get('username')) {
      errors.username = "Username is required";
    }
    
    if (!formData.get('full_name')) {
      errors.full_name = "Full name is required";
    }
    
    if (!formData.get('phone')) {
      errors.phone = "Phone number is required";
    } else {
      const phonePattern = /^\d{10}$/;
      if (!phonePattern.test(String(formData.get('phone')))) {
        errors.phone = "Please enter a valid 10-digit phone number";
      }
    }
    
    if (!formData.get('college')) {
      errors.college = "Please select your college";
    }
    
    // Check LPU registration number if college is LPU
    if (formData.get('college') === "Lovely Professional University") {
      if (!formData.get('registration_number')) {
        errors.registration_number = "Registration number is required for LPU students";
      } else {
        const regNoPattern = /^[A-Z0-9]{8,12}$/i;
        if (!regNoPattern.test(String(formData.get('registration_number')))) {
          errors.registration_number = "Please enter a valid registration number (8-12 alphanumeric characters)";
        }
      }
    }
    
    return errors;
  };

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
    
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please check the form for errors",
        variant: "destructive",
      });
      return;
    }
    
    const isProfileCompleted = true; // Always set to true since we're validating all required fields
    
    const updates = {
      username: String(formData.get('username')),
      full_name: String(formData.get('full_name')),
      bio: String(formData.get('bio')),
      age: formData.get('age') ? parseInt(String(formData.get('age'))) : null,
      phone: String(formData.get('phone')),
      country: String(formData.get('country')),
      state: String(formData.get('state')),
      city: String(formData.get('city')),
      college: String(formData.get('college')),
      registration_number: formData.get('registration_number') ? String(formData.get('registration_number')) : null,
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
      description: isFirstTimeSetup 
        ? "Profile completed successfully! Welcome to ThaughtScape!"
        : "Profile updated successfully",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-purple-200">
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
          <Label htmlFor="username" className={formErrors.username ? "text-red-500" : ""}>
            Username*
          </Label>
          <Input
            id="username"
            name="username"
            defaultValue={profile.username || ''}
            required
            className={`mt-1 ${formErrors.username ? "border-red-500" : ""}`}
          />
          {formErrors.username && <p className="text-sm text-red-500 mt-1">{formErrors.username}</p>}
        </div>
        <div>
          <Label htmlFor="full_name" className={formErrors.full_name ? "text-red-500" : ""}>
            Full Name*
          </Label>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={profile.full_name || ''}
            required
            className={`mt-1 ${formErrors.full_name ? "border-red-500" : ""}`}
          />
          {formErrors.full_name && <p className="text-sm text-red-500 mt-1">{formErrors.full_name}</p>}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="phone" className={formErrors.phone ? "text-red-500" : ""}>
            Phone Number*
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={profile.phone || ''}
            required
            className={`mt-1 ${formErrors.phone ? "border-red-500" : ""}`}
            placeholder="10-digit number"
          />
          {formErrors.phone && <p className="text-sm text-red-500 mt-1">{formErrors.phone}</p>}
        </div>
        <div>
          <Label htmlFor="college" className={formErrors.college ? "text-red-500" : ""}>
            College/University*
          </Label>
          <Select 
            name="college" 
            defaultValue={profile.college || ''}
            onValueChange={setSelectedCollege}
            required
          >
            <SelectTrigger className={`mt-1 ${formErrors.college ? "border-red-500" : ""}`}>
              <SelectValue placeholder="Select your college" />
            </SelectTrigger>
            <SelectContent>
              {collegeOptions.map((college) => (
                <SelectItem key={college} value={college}>
                  {college}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.college && <p className="text-sm text-red-500 mt-1">{formErrors.college}</p>}
        </div>
      </div>

      {selectedCollege === "Lovely Professional University" && (
        <div>
          <Label htmlFor="registration_number" className={formErrors.registration_number ? "text-red-500" : ""}>
            LPU Registration Number*
          </Label>
          <Input
            id="registration_number"
            name="registration_number"
            defaultValue={profile.registration_number || ''}
            required
            className={`mt-1 ${formErrors.registration_number ? "border-red-500" : ""}`}
            placeholder="Your LPU Registration Number"
          />
          {formErrors.registration_number && <p className="text-sm text-red-500 mt-1">{formErrors.registration_number}</p>}
        </div>
      )}

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
        className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : isFirstTimeSetup ? "Complete Profile" : "Save Changes"}
      </Button>
    </form>
  );
};
