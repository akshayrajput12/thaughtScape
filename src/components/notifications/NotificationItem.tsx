
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@/types";

interface NotificationItemProps {
  notification: Notification;
  onFollowBack?: () => void;
}

export const NotificationItem = ({ notification, onFollowBack }: NotificationItemProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFollowBack = async () => {
    if (!notification.related_user_id) return;

    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: notification.user_id,
        following_id: notification.related_user_id
      });

    if (error) {
      toast({
        title: "Error",
        description: "Could not follow user",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "You are now following this user",
    });

    onFollowBack?.();
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
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleFollowBack();
              }}
            >
              Follow Back
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
