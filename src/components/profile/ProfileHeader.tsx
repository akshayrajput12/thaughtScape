
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InterestsSelector } from '@/components/profile/InterestsSelector';
import { PencilIcon, UserPlus, UserMinus, AtSign, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Profile } from "@/types";

interface ProfileHeaderProps {
  profile: Profile;
  isFollowing: boolean;
  onFollowToggle: () => void;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isFollowing,
  onFollowToggle,
  followersCount,
  followingCount,
  postsCount,
}) => {
  const { user } = useAuth();
  const isOwnProfile = user?.id === profile.id;
  const [interestsDialogOpen, setInterestsDialogOpen] = useState(false);

  return (
    <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-6 mb-8">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Profile Image */}
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
          <img
            src={profile.avatar_url || "/placeholder.svg"}
            alt={profile.username}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg";
            }}
          />
        </div>

        {/* Profile Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.full_name}
              </h1>
              <div className="flex items-center justify-center md:justify-start text-gray-600 mt-1">
                <AtSign className="h-4 w-4 mr-1" />
                <span>{profile.username}</span>
              </div>
            </div>

            {/* Follow/Edit Button */}
            <div>
              {isOwnProfile ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Handle edit profile functionality
                    window.location.href = `/profile/${profile.id}?edit=true`;
                  }}
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <Button
                  variant={isFollowing ? "destructive" : "default"}
                  size="sm"
                  onClick={onFollowToggle}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="my-4 text-gray-700 max-w-2xl">{profile.bio}</p>
          )}

          {/* Joined Date */}
          <div className="flex items-center justify-center md:justify-start text-gray-500 text-sm mt-2">
            <Calendar className="h-4 w-4 mr-1" />
            <span>
              Joined{" "}
              {profile.created_at &&
                format(new Date(profile.created_at), "MMMM yyyy")}
            </span>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-4 text-sm">
            <div className="flex flex-col items-center md:items-start">
              <span className="font-bold text-gray-900">{postsCount}</span>
              <span className="text-gray-600">Thoughts</span>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <span className="font-bold text-gray-900">{followersCount}</span>
              <span className="text-gray-600">Followers</span>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <span className="font-bold text-gray-900">{followingCount}</span>
              <span className="text-gray-600">Following</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interests/Genres Section */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium text-gray-900">Interests</h2>
          {isOwnProfile && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setInterestsDialogOpen(true)}
            >
              Manage Interests
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {profile.genres && profile.genres.length > 0 ? (
            profile.genres.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700"
              >
                {genre}
              </span>
            ))
          ) : (
            <p className="text-gray-500">No interests added yet</p>
          )}
        </div>
      </div>

      {/* Interests Dialog */}
      <Dialog open={interestsDialogOpen} onOpenChange={setInterestsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Your Interests</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <InterestsSelector 
              userId={profile.id} 
              initialInterests={profile.genres}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
