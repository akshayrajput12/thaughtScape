
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ExternalLink, MessageSquare, Instagram, Twitter, Linkedin, Link as LinkIcon, Camera, BriefcaseIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Profile } from '@/types';
import { useNavigate } from 'react-router-dom';

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile?: boolean;
  isEditing?: boolean;
  onEditClick?: () => void;
  isFollowing?: boolean;
  isBlocked?: boolean;
  isBlockedByUser?: boolean;
  onFollowToggle?: () => void;
  onBlock?: () => void;
  onUnblock?: () => void;
  onMessage?: () => void;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isAdmin?: boolean;
}

export function ProfileHeader({
  profile,
  isOwnProfile = false,
  isEditing = false,
  onEditClick,
  isFollowing = false,
  isBlocked = false,
  isBlockedByUser = false,
  onFollowToggle,
  onBlock,
  onUnblock,
  onMessage,
  postsCount,
  followersCount,
  followingCount,
  isAdmin = false,
}: ProfileHeaderProps) {
  const navigate = useNavigate();
  const [showSocialLinks, setShowSocialLinks] = useState(false);

  const toggleSocialLinks = () => {
    setShowSocialLinks(!showSocialLinks);
  };

  // Check if user has any social media links
  const hasSocialLinks = profile.instagram_url || profile.twitter_url || profile.linkedin_url || profile.portfolio_url || profile.snapchat_url;

  return (
    <div className="relative bg-card/60 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-border/50">
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-lg opacity-70"></div>
          <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/10 to-secondary/10">
              {(profile.full_name?.[0] || profile.username?.[0] || '?').toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-wrap justify-center md:justify-between gap-2 items-center">
            <div>
              <h1 className="text-2xl font-bold">{profile.full_name}</h1>
              <div className="text-muted-foreground">@{profile.username}</div>
              {profile.college && (
                <div className="text-sm text-muted-foreground mt-1">
                  {profile.college}
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {!isEditing && !isOwnProfile && !isBlockedByUser && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={onFollowToggle}
                    disabled={isBlocked}
                    className={isFollowing ? "border-primary text-primary hover:bg-primary/10" : ""}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={onMessage}
                    disabled={isBlocked || isBlockedByUser}
                    className="gap-1.5"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!isBlocked ? (
                        <DropdownMenuItem className="text-red-500 cursor-pointer" onClick={onBlock}>
                          Block User
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="cursor-pointer" onClick={onUnblock}>
                          Unblock User
                        </DropdownMenuItem>
                      )}
                      
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => navigate(`/admin?user=${profile.id}`)}
                          >
                            Manage as Admin
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              
              {!isEditing && isOwnProfile && (
                <Button onClick={onEditClick} variant="outline" className="gap-1.5">
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
          
          {profile.bio && (
            <p className="text-sm max-w-prose whitespace-pre-line">
              {profile.bio}
            </p>
          )}
          
          {hasSocialLinks && (
            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-3">
                {profile.instagram_url && (
                  <a 
                    href={profile.instagram_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                
                {profile.twitter_url && (
                  <a 
                    href={profile.twitter_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                
                {profile.linkedin_url && (
                  <a 
                    href={profile.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                
                {profile.portfolio_url && (
                  <a 
                    href={profile.portfolio_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Portfolio"
                  >
                    <BriefcaseIcon className="h-5 w-5" />
                  </a>
                )}
                
                {profile.snapchat_url && (
                  <a 
                    href={profile.snapchat_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Snapchat"
                  >
                    <Camera className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
