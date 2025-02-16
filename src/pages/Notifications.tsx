
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { motion } from "framer-motion";
import type { Notification } from "@/types";

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          related_user:profiles!notifications_related_user_id_fkey(*)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Ensure the notification type is one of the allowed values
        const validNotifications = data.filter(notification => 
          ['follow', 'like', 'comment', 'message'].includes(notification.type)
        ) as Notification[];
        
        setNotifications(validNotifications);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        fetchNotifications
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto space-y-4"
      >
        <h1 className="text-3xl font-serif font-bold mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Notifications
        </h1>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onFollowBack={() => {
                const updatedNotifications = notifications.map(n => 
                  n.id === notification.id ? { ...n, is_read: true } : n
                );
                setNotifications(updatedNotifications);
              }}
            />
          ))
        )}
      </motion.div>
    </div>
  );
};

export default Notifications;
