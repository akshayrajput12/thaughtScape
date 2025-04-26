import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Profile } from "@/types";
import { Instagram, Linkedin, Twitter, Youtube, Link as LinkIcon, Github } from "lucide-react";
import { ProfileImageUpload } from "./ProfileImageUpload";
import { SnapchatIcon } from "@/components/icons/SnapchatIcon";

const colleges = [
  "Lovely Professional University",
  "Delhi University",
  "IIT Delhi",
  "IIT Bombay",
  "IIT Madras",
  "Amity University",
  "Chandigarh University",
  "Thapar University",
  "Other"
];

interface ProfileFormProps {
  profile: Profile;
  onSubmitSuccess: (updatedProfile: Profile) => void;
  isFirstTimeSetup?: boolean;
}

export const ProfileForm = ({ profile, onSubmitSuccess, isFirstTimeSetup = false }: ProfileFormProps) => {
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [college, setCollege] = useState(profile.college || "");
  const [registrationNumber, setRegistrationNumber] = useState(profile.registration_number || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [country, setCountry] = useState(profile.country || "");
  const [state, setState] = useState(profile.state || "");
  const [city, setCity] = useState(profile.city || "");
  const [age, setAge] = useState(profile.age?.toString() || "");
  const [instagramUrl, setInstagramUrl] = useState(profile.instagram_url || "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url || "");
  const [twitterUrl, setTwitterUrl] = useState(profile.twitter_url || "");
  const [snapchatUrl, setSnapchatUrl] = useState(profile.snapchat_url || "");
  const [youtubeUrl, setYoutubeUrl] = useState(profile.youtube_url || "");
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolio_url || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [githubUrl, setGithubUrl] = useState(profile.github_url || "");

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const phoneRegex = /^[0-9]{10}$/;
    const ageValue = parseInt(age);
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

    if (isFirstTimeSetup) {
      if (!fullName) newErrors.fullName = "Full name is required";
      if (!phone) newErrors.phone = "Phone number is required";
      else if (!phoneRegex.test(phone)) newErrors.phone = "Phone number must be 10 digits";
      if (!college) newErrors.college = "Please select your college";
      if (college === "Lovely Professional University" && !registrationNumber) {
        newErrors.registrationNumber = "Registration number is required for LPU students";
      }
    } else {
      if (phone && !phoneRegex.test(phone)) newErrors.phone = "Phone number must be 10 digits";
      if (age && (isNaN(ageValue) || ageValue < 13 || ageValue > 100)) {
        newErrors.age = "Age must be between 13 and 100";
      }
    }

    if (instagramUrl && !urlRegex.test(instagramUrl)) {
      newErrors.instagramUrl = "Please enter a valid URL";
    }
    if (linkedinUrl && !urlRegex.test(linkedinUrl)) {
      newErrors.linkedinUrl = "Please enter a valid URL";
    }
    if (twitterUrl && !urlRegex.test(twitterUrl)) {
      newErrors.twitterUrl = "Please enter a valid URL";
    }
    if (snapchatUrl && !urlRegex.test(snapchatUrl)) {
      newErrors.snapchatUrl = "Please enter a valid URL";
    }
    if (youtubeUrl && !urlRegex.test(youtubeUrl)) {
      newErrors.youtubeUrl = "Please enter a valid URL";
    }
    if (portfolioUrl && !urlRegex.test(portfolioUrl)) {
      newErrors.portfolioUrl = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const updatedProfile: Partial<Profile> = {
        full_name: fullName,
        bio,
        country,
        state,
        city,
        phone,
        college,
        registration_number: registrationNumber,
        instagram_url: instagramUrl,
        linkedin_url: linkedinUrl,
        twitter_url: twitterUrl,
        snapchat_url: snapchatUrl,
        youtube_url: youtubeUrl,
        portfolio_url: portfolioUrl,
        avatar_url: avatarUrl,
        is_profile_completed: true,
        github_url: githubUrl,
      };

      if (age) updatedProfile.age = parseInt(age);

      const { data, error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      if (data) {
        onSubmitSuccess(data as Profile);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUploaded = (url: string) => {
    setAvatarUrl(url);
  };

  const isLPU = college === "Lovely Professional University";

  const SocialMediaInput = ({
    id,
    icon,
    value,
    onChange,
    placeholder,
    error
  }: {
    id: string;
    icon: React.ReactNode;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    error?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center">
        <div className="mr-2">{icon}</div>
        <Label htmlFor={id} className="text-sm font-medium text-gray-700">
          {id.charAt(0).toUpperCase() + id.slice(1).replace('Url', '')} URL
        </Label>
      </div>
      <Input
        id={id}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`border-gray-300 focus:ring-purple-500 focus:border-purple-500 ${error ? 'border-red-500' : ''}`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isFirstTimeSetup && (
        <div className="flex justify-center mb-8">
          <ProfileImageUpload profile={profile} onImageUploaded={handleImageUploaded} />
        </div>
      )}

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
            Full Name {isFirstTimeSetup && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            className={`border-gray-300 focus:ring-purple-500 focus:border-purple-500 ${errors.fullName ? 'border-red-500' : ''}`}
          />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Phone Number {isFirstTimeSetup && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            className={`border-gray-300 focus:ring-purple-500 focus:border-purple-500 ${errors.phone ? 'border-red-500' : ''}`}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="college" className="text-sm font-medium text-gray-700">
            College {isFirstTimeSetup && <span className="text-red-500">*</span>}
          </Label>
          <Select
            value={college}
            onValueChange={setCollege}
          >
            <SelectTrigger className={`border-gray-300 focus:ring-purple-500 focus:border-purple-500 ${errors.college ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select your college" />
            </SelectTrigger>
            <SelectContent>
              {colleges.map((collegeName) => (
                <SelectItem key={collegeName} value={collegeName}>
                  {collegeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.college && <p className="text-red-500 text-xs mt-1">{errors.college}</p>}
        </div>

        {isLPU && (
          <div className="space-y-2">
            <Label htmlFor="registrationNumber" className="text-sm font-medium text-gray-700">
              Registration Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="registrationNumber"
              type="text"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="Enter your registration number"
              className={`border-gray-300 focus:ring-purple-500 focus:border-purple-500 ${errors.registrationNumber ? 'border-red-500' : ''}`}
            />
            {errors.registrationNumber && <p className="text-red-500 text-xs mt-1">{errors.registrationNumber}</p>}
          </div>
        )}

        {!isFirstTimeSetup && (
          <>
            <div className="space-y-2">
              <Label htmlFor="age" className="text-sm font-medium text-gray-700">Age</Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter your age"
                className={`border-gray-300 focus:ring-purple-500 focus:border-purple-500 ${errors.age ? 'border-red-500' : ''}`}
              />
              {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium text-gray-700">Country</Label>
              <Input
                id="country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Enter your country"
                className="border-gray-300 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-medium text-gray-700">State</Label>
              <Input
                id="state"
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Enter your state"
                className="border-gray-300 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium text-gray-700">City</Label>
              <Input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter your city"
                className="border-gray-300 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </>
        )}

        {!isFirstTimeSetup && (
          <>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio" className="text-sm font-medium text-gray-700">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write something about yourself"
                className="border-gray-300 focus:ring-purple-500 focus:border-purple-500 min-h-[100px]"
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="font-medium text-gray-700 mb-4">Social Media & Portfolio Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SocialMediaInput
                  id="portfolioUrl"
                  icon={<LinkIcon className="h-4 w-4 text-gray-600" />}
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://yourportfolio.com"
                  error={errors.portfolioUrl}
                />

                <SocialMediaInput
                  id="instagramUrl"
                  icon={<Instagram className="h-4 w-4 text-pink-600" />}
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/username"
                  error={errors.instagramUrl}
                />

                <SocialMediaInput
                  id="linkedinUrl"
                  icon={<Linkedin className="h-4 w-4 text-blue-600" />}
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  error={errors.linkedinUrl}
                />

                <SocialMediaInput
                  id="twitterUrl"
                  icon={<Twitter className="h-4 w-4 text-sky-500" />}
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://twitter.com/username"
                  error={errors.twitterUrl}
                />

                <SocialMediaInput
                  id="snapchatUrl"
                  icon={<SnapchatIcon className="h-4 w-4 text-yellow-400" />}
                  value={snapchatUrl}
                  onChange={(e) => setSnapchatUrl(e.target.value)}
                  placeholder="https://snapchat.com/add/username"
                  error={errors.snapchatUrl}
                />

                <SocialMediaInput
                  id="youtubeUrl"
                  icon={<Youtube className="h-4 w-4 text-red-600" />}
                  value={youtubeUrl || ''}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/channel/username"
                  error={errors.youtubeUrl}
                />
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="mr-2"><Github className="h-4 w-4 text-gray-600" /></div>
                    <Label htmlFor="githubUrl" className="text-sm font-medium text-gray-700">
                      GitHub URL
                    </Label>
                  </div>
                  <Input
                    id="githubUrl"
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>

      <div className="flex justify-end pt-6 pb-12 md:pb-0">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-2 rounded-md shadow-md transition-all duration-300 hover:shadow-lg"
        >
          {isSubmitting ? "Saving..." : isFirstTimeSetup ? "Complete Profile" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};
