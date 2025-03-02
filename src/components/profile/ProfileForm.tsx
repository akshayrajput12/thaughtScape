
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
import { z } from "zod";

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const phoneRegex = /^[0-9]{10}$/;
    const ageValue = parseInt(age);

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
        is_profile_completed: true
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

  const isLPU = college === "Lovely Professional University";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        )}
      </motion.div>

      <div className="flex justify-end">
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
