import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import type { Profile } from "@/types";

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile: boolean;
  isEditing: boolean;
  onEditClick: () => void;
}

export const ProfileHeader = ({ 
  profile, 
  isOwnProfile, 
  isEditing, 
  onEditClick 
}: ProfileHeaderProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Avatar className="w-24 h-24">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || profile.username} />
            <AvatarFallback>
              <User className="w-10 h-10 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {profile.full_name || profile.username}
            </h1>
            <p className="text-gray-600">@{profile.username}</p>
          </div>
        </div>
        {isOwnProfile && (
          <Button 
            onClick={onEditClick}
            variant={isEditing ? "outline" : "default"}
            className="transition-all duration-200 hover:scale-105"
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        )}
      </div>
      {!isEditing && profile.bio && (
        <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
      )}
      {!isEditing && (
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
          {profile.city && profile.country && (
            <span>📍 {profile.city}, {profile.country}</span>
          )}
          {profile.age && (
            <span>🎂 {profile.age} years old</span>
          )}
        </div>
      )}
    </div>
  );
};