import { Button } from "@/components/ui/button";
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
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">
            {profile.full_name || profile.username}
          </h1>
          <p className="text-gray-600">@{profile.username}</p>
        </div>
        {isOwnProfile && (
          <Button onClick={onEditClick}>
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        )}
      </div>
      {!isEditing && profile.bio && (
        <p className="text-gray-700">{profile.bio}</p>
      )}
    </div>
  );
};