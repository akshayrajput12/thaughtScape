
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Tag, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@/types";

interface TaggedPostNotificationProps {
  notification: Notification;
  onAction: (accepted: boolean) => void;
}

export const TaggedPostNotification = ({ notification, onAction }: TaggedPostNotificationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleAccept = async () => {
    setIsLoading(true);
    try {
      // Update the notification status
      const { error } = await supabase
        .from('notifications')
        .update({ 
          content: notification.content + " (Accepted)", 
          is_read: true 
        })
        .eq('id', notification.id);
        
      if (error) throw error;
      
      // Here you'd update the thought to confirm the tag
      // This would depend on how you structure your tagging system in the database
      
      toast({
        title: "Success",
        description: "You accepted being tagged in this post",
      });
      
      onAction(true);
    } catch (error) {
      console.error('Error accepting tag:', error);
      toast({
        title: "Error",
        description: "Failed to accept tag",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDecline = async () => {
    setIsLoading(true);
    try {
      // Update the notification status
      const { error } = await supabase
        .from('notifications')
        .update({ 
          content: notification.content + " (Declined)", 
          is_read: true 
        })
        .eq('id', notification.id);
        
      if (error) throw error;
      
      // Here you'd update the thought to remove the tag
      // This would depend on how you structure your tagging system in the database
      
      toast({
        title: "Success",
        description: "You declined being tagged in this post",
      });
      
      onAction(false);
    } catch (error) {
      console.error('Error declining tag:', error);
      toast({
        title: "Error",
        description: "Failed to decline tag",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleViewPost = () => {
    if (notification.related_thought_id) {
      navigate(`/thought/${notification.related_thought_id}`);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white border border-purple-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="bg-purple-100 p-2 rounded-full">
          <Tag className="h-5 w-5 text-purple-600" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">Tagged in a post</h4>
          <p className="text-sm text-gray-600 mt-1 mb-3">
            {notification.content}
          </p>
          
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewPost}
              className="text-xs"
            >
              <MessageSquare className="mr-1 h-3 w-3" />
              View Post
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={handleAccept}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-xs"
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              Accept
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              disabled={isLoading}
              className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
            >
              <XCircle className="mr-1 h-3 w-3" />
              Decline
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
