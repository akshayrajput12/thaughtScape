
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Instagram, Linkedin, Twitter } from "lucide-react";
import { Profile } from "@/types";

interface ProfileHeaderProps {
  profile: Profile;
  isFollowing: boolean;
  onFollowToggle: () => void;
  isOwnProfile: boolean;
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

export function ProfileHeader({
  profile,
  isFollowing,
  onFollowToggle,
  isOwnProfile,
  postsCount,
  followersCount,
  followingCount
}: ProfileHeaderProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-start gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
              <p className="text-gray-600">@{profile.username}</p>
            </div>
            
            {!isOwnProfile && (
              <Button
                onClick={onFollowToggle}
                variant={isFollowing ? "outline" : "default"}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            )}
          </div>
          
          <div className="mt-4 flex gap-6">
            <div>
              <span className="font-semibold">{postsCount}</span>
              <span className="text-gray-600 ml-1">posts</span>
            </div>
            <div>
              <span className="font-semibold">{followersCount}</span>
              <span className="text-gray-600 ml-1">followers</span>
            </div>
            <div>
              <span className="font-semibold">{followingCount}</span>
              <span className="text-gray-600 ml-1">following</span>
            </div>
          </div>
          
          {profile.bio && (
            <p className="mt-4 text-gray-800">{profile.bio}</p>
          )}
          
          <div className="mt-4 flex gap-4">
            {profile.instagram_url && (
              <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer">
                <Instagram className="h-5 w-5 text-gray-600 hover:text-pink-600" />
              </a>
            )}
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-5 w-5 text-gray-600 hover:text-blue-600" />
              </a>
            )}
            {profile.twitter_url && (
              <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer">
                <Twitter className="h-5 w-5 text-gray-600 hover:text-sky-500" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
