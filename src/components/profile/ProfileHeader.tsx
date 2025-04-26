
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Edit,
  UserPlus,
  UserMinus,
  Shield,
  LinkedinIcon,
  TwitterIcon,
  InstagramIcon
} from "lucide-react";
import { Profile } from "@/types";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ProfileHeaderProps {
  profile: Profile;
  isFollowing: boolean;
  onFollowToggle: () => void;
  isOwnProfile: boolean;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isEditing?: boolean;
  onEditClick?: () => void;
  isBlocked?: boolean;
  isBlockedByUser?: boolean;
  onBlock?: () => void;
  onUnblock?: () => void;
  onMessage?: () => void;
  onFollow?: () => void;
  onUnfollow?: () => void;
  isAdmin?: boolean;
}

export function ProfileHeader({
  profile,
  isFollowing,
  onFollowToggle,
  isOwnProfile,
  postsCount,
  followersCount,
  followingCount,
  isEditing,
  onEditClick,
  isBlocked,
  isBlockedByUser,
  onBlock,
  onUnblock,
  onMessage,
  onFollow,
  onUnfollow,
  isAdmin
}: ProfileHeaderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messageText, setMessageText] = useState("");
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const handleAdminDashboardClick = async () => {
    // Double-check if the user is actually an admin before navigating
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast({
          title: "Error",
          description: "You must be logged in to access the admin dashboard",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error("Error checking admin status:", error);
        toast({
          title: "Error",
          description: "Could not verify admin status",
          variant: "destructive",
        });
        return;
      }

      if (!data?.is_admin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin dashboard",
          variant: "destructive",
        });
        return;
      }

      // If we get here, the user is confirmed to be an admin
      navigate('/admin');
    } catch (error) {
      console.error("Error navigating to admin dashboard:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setIsSendingMessage(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast({
          title: "Error",
          description: "You must be logged in to send messages",
          variant: "destructive",
        });
        return;
      }

      // Create a new message
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: session.user.id,
          recipient_id: profile.id,
          content: messageText,
          is_read: false
        });

      if (error) throw error;

      // Create a notification for the recipient
      await supabase
        .from('notifications')
        .insert({
          user_id: profile.id,
          type: 'message',
          content: 'You have a new message',
          related_user_id: session.user.id
        });

      toast({
        title: "Success",
        description: "Message sent successfully",
      });

      setMessageText("");
      setIsMessageDialogOpen(false);

      // Call the onMessage callback if provided
      if (onMessage) {
        onMessage();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };
  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
      <div className="flex items-start gap-6">
        <Avatar className="h-24 w-24 border-2 border-primary/10">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{profile.full_name || profile.username}</h1>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {isOwnProfile ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={onEditClick}
                    variant={isEditing ? "outline" : "default"}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </Button>

                  {isAdmin && (
                    <Button
                      onClick={handleAdminDashboardClick}
                      variant="outline"
                      className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                    >
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <Button
                    onClick={onFollowToggle}
                    variant={isFollowing ? "outline" : "default"}
                    className="flex items-center gap-1"
                    size="sm"
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="h-4 w-4" />
                        <span>Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </Button>

                  {!isBlocked && !isBlockedByUser && (
                    <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Message
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <span>Message to {profile.username}</span>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-4">
                          <div className="flex items-center gap-4 p-2 rounded-lg bg-muted/50">
                            <Avatar className="h-10 w-10 border border-primary/10">
                              <AvatarImage src={profile.avatar_url || undefined} />
                              <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm text-foreground">{profile.username}</p>
                              <p className="text-xs text-muted-foreground">{profile.full_name}</p>
                            </div>
                          </div>
                          <Textarea
                            placeholder="Write your message here..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            className="min-h-[120px]"
                          />
                        </div>
                        <DialogFooter className="sm:justify-between">
                          <DialogClose asChild>
                            <Button variant="outline" size="sm">Cancel</Button>
                          </DialogClose>
                          <Button
                            onClick={handleSendMessage}
                            disabled={isSendingMessage || !messageText.trim()}
                            size="sm"
                            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                          >
                            {isSendingMessage ? "Sending..." : "Send Message"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {!isBlockedByUser && (
                    <Button
                      onClick={isBlocked ? onUnblock : onBlock}
                      variant="outline"
                      size="sm"
                      className={isBlocked ? "text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-900 dark:hover:bg-green-950" : "text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950"}
                    >
                      {isBlocked ? "Unblock" : "Block"}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-6">
            <div>
              <span className="font-semibold text-foreground">{postsCount}</span>
              <span className="text-muted-foreground ml-1">posts</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">{followersCount}</span>
              <span className="text-muted-foreground ml-1">followers</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">{followingCount}</span>
              <span className="text-muted-foreground ml-1">following</span>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 text-foreground">{profile.bio}</p>
          )}

          <div className="mt-4 flex gap-4">
            {profile.instagram_url && (
              <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer">
                <InstagramIcon className="h-5 w-5 text-muted-foreground hover:text-pink-500 transition-colors" />
              </a>
            )}
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                <LinkedinIcon className="h-5 w-5 text-muted-foreground hover:text-blue-500 transition-colors" />
              </a>
            )}
            {profile.twitter_url && (
              <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer">
                <TwitterIcon className="h-5 w-5 text-muted-foreground hover:text-sky-400 transition-colors" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
