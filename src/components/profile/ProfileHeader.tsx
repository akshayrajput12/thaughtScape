
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  CalendarDays, 
  MapPin, 
  School, 
  MoreHorizontal, 
  MessageSquare, 
  UserCheck, 
  UserMinus, 
  UserX, 
  ShieldCheck, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter, 
  Youtube, 
  Link as LinkIcon 
} from "lucide-react";
import { Github } from 'lucide-react';
import { SnapchatIcon } from "@/components/icons/SnapchatIcon";

import { formatDistanceToNow } from 'date-fns';
import type { Profile } from '@/types';

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile: boolean;
  isEditing: boolean;
  onEditClick: () => void;
  isFollowing: boolean;
  isBlocked: boolean;
  isBlockedByUser: boolean;
  onFollowToggle: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  onMessage: () => void;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isAdmin?: boolean;
}

export const ProfileHeader = ({
  profile,
  isOwnProfile,
  isEditing,
  onEditClick,
  isFollowing,
  isBlocked,
  isBlockedByUser,
  onFollowToggle,
  onBlock,
  onUnblock,
  onMessage,
  postsCount,
  followersCount,
  followingCount,
  isAdmin = false,
}: ProfileHeaderProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleViewAdmin = () => {
    navigate('/admin');
  };

  if (!profile) return null;

  const showLocation = profile.city || profile.state || profile.country;
  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(', ');
  
  const getSocialLinks = () => {
    const links = [];
    
    if (profile.portfolio_url) {
      links.push({
        url: profile.portfolio_url,
        icon: <LinkIcon size={16} className="text-gray-600" />,
        name: 'Portfolio'
      });
    }

    if (profile.github_url) {
      links.push({
        url: profile.github_url,
        icon: <Github size={16} className="text-gray-800" />,
        name: 'GitHub'
      });
    }

    if (profile.snapchat_url) {
      links.push({
        url: profile.snapchat_url,
        icon: <SnapchatIcon className="text-yellow-400" width={16} height={16} />,
        name: 'Snapchat'
      });
    }
    
    if (profile.instagram_url) {
      links.push({
        url: profile.instagram_url,
        icon: <Instagram size={16} className="text-pink-600" />,
        name: 'Instagram'
      });
    }
    
    if (profile.linkedin_url) {
      links.push({
        url: profile.linkedin_url,
        icon: <Linkedin size={16} className="text-blue-600" />,
        name: 'LinkedIn'
      });
    }
    
    if (profile.twitter_url) {
      links.push({
        url: profile.twitter_url,
        icon: <Twitter size={16} className="text-sky-500" />,
        name: 'Twitter'
      });
    }
    
    if (profile.youtube_url) {
      links.push({
        url: profile.youtube_url,
        icon: <Youtube size={16} className="text-red-600" />,
        name: 'YouTube'
      });
    }
    
    return links;
  };

  const socialLinks = getSocialLinks();

  return (
    <div className="bg-white shadow rounded-xl overflow-hidden">
      <div className="h-32 sm:h-48 bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500"></div>
      
      <div className="relative px-4 sm:px-6 pb-6">
        <div className="absolute -top-16 left-6 ring-4 ring-white rounded-full">
          <Avatar className="w-28 h-28 border-4 border-white shadow-lg">
            <AvatarImage src={profile.avatar_url || ''} alt={profile.username} className="object-cover" />
            <AvatarFallback className="text-3xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              {profile.full_name?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex justify-end mt-2 gap-2">
          {isAdmin && !isOwnProfile && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="border-purple-200 text-purple-700 flex items-center gap-1 px-3 py-1.5">
                    <ShieldCheck size={14} />
                    <span>Admin</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This user is an admin</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {isOwnProfile && isAdmin && (
            <Button 
              variant="outline"
              size="sm"
              onClick={handleViewAdmin}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <ShieldCheck size={16} className="mr-2" />
              Admin Panel
            </Button>
          )}

          {isOwnProfile && !isEditing && (
            <Button 
              variant="outline"
              size="sm"
              onClick={onEditClick}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              Edit Profile
            </Button>
          )}

          {!isOwnProfile && !isBlockedByUser && (
            <>
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                onClick={onFollowToggle}
                disabled={isBlocked}
                className={isFollowing 
                  ? "border-purple-200 text-purple-700 hover:bg-purple-50" 
                  : "bg-purple-600 hover:bg-purple-700 text-white"
                }
              >
                {isFollowing ? (
                  <>
                    <UserCheck size={16} className="mr-2" />
                    Following
                  </>
                ) : (
                  <>
                    <UserCheck size={16} className="mr-2" />
                    Follow
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onMessage}
                disabled={isBlocked || isBlockedByUser}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <MessageSquare size={16} className="mr-2" />
                Message
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                    <MoreHorizontal size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isBlocked ? (
                    <DropdownMenuItem onClick={onUnblock}>
                      <UserCheck size={16} className="mr-2 text-green-600" />
                      <span>Unblock User</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={onBlock}>
                      <UserX size={16} className="mr-2 text-red-600" />
                      <span>Block User</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        <div className="mt-16 space-y-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.full_name || profile.username}
              </h1>

              {profile.is_profile_completed && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="h-5">Verified</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Profile verified</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-gray-500 text-sm">@{profile.username}</p>
          </div>

          {isBlocked && (
            <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg text-sm">
              You have blocked this user.
            </div>
          )}

          {isBlockedByUser && (
            <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg text-sm">
              This user has blocked you.
            </div>
          )}
          
          {!isBlocked && !isBlockedByUser && profile.bio && (
            <p className="text-gray-700">{profile.bio}</p>
          )}

          {!isEditing && (
            <div className="flex flex-wrap gap-y-3 gap-x-6 text-sm text-gray-500 pt-2">
              <div className="flex items-center gap-1.5">
                <CalendarDays size={18} className="text-gray-400" />
                <span>Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}</span>
              </div>
              
              {showLocation && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={18} className="text-gray-400" />
                  <span>{location}</span>
                </div>
              )}
              
              {profile.college && (
                <div className="flex items-center gap-1.5">
                  <School size={18} className="text-gray-400" />
                  <span>{profile.college}</span>
                </div>
              )}
            </div>
          )}

          {!isEditing && socialLinks.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-3">
              {socialLinks.map((link, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        {link.icon}
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{link.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
