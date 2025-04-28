
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@/types";
import { useEffect, useState } from "react";

interface NotificationItemProps {
  notification: Notification;
  onFollowBack?: () => void;
}

export const NotificationItem = ({ notification, onFollowBack }: NotificationItemProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);

  // Check if the user is already following the other user
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!notification.related_user_id) return;

      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', notification.user_id)
        .eq('following_id', notification.related_user_id)
        .maybeSingle();

      if (!error) {
        setIsFollowing(!!data);
      }
    };

    checkFollowStatus();
  }, [notification.user_id, notification.related_user_id]);

  const handleFollowBack = async () => {
    if (!notification.related_user_id) return;

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', notification.user_id)
          .eq('following_id', notification.related_user_id);

        if (error) throw error;

        setIsFollowing(false);
        toast({
          title: "Success",
          description: "You have unfollowed this user",
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: notification.user_id,
            following_id: notification.related_user_id
          });

        if (error) throw error;

        setIsFollowing(true);
        toast({
          title: "Success",
          description: "You are now following this user",
        });
      }

      onFollowBack?.();
    } catch (error) {
      console.error("Error toggling follow status:", error);
      toast({
        title: "Error",
        description: isFollowing ? "Could not unfollow user" : "Could not follow user",
        variant: "destructive",
      });
    }
  };

  const getNotificationContent = () => {
    switch (notification.type) {
      case 'follow':
        return (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={notification.related_user?.avatar_url || undefined} />
                <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
              </Avatar>
              <p className="text-sm">
                <span className="font-medium">{notification.related_user?.username}</span>
                {' started following you'}
              </p>
            </div>
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              className={isFollowing ? "border-primary text-primary hover:bg-primary/10" : ""}
              onClick={(e) => {
                e.stopPropagation();
                handleFollowBack();
              }}
            >
              {isFollowing ? 'Following' : 'Follow Back'}
            </Button>
          </div>
        );
      case 'like':
        return (
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={notification.related_user?.avatar_url || undefined} />
              <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
            </Avatar>
            <p className="text-sm">
              <span className="font-medium">{notification.related_user?.username}</span>
              {' liked your poem'}
            </p>
          </div>
        );
      default:
        return <p>{notification.content}</p>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg cursor-pointer transition-colors ${
        notification.is_read ? 'bg-white' : 'bg-primary/10'
      }`}
      onClick={() => {
        if (notification.related_user_id) {
          navigate(`/profile/${notification.related_user_id}`);
        }
      }}
    >
      {getNotificationContent()}
    </motion.div>
  );
};
