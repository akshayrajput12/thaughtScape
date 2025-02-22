
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Home, PenTool, Compass } from "lucide-react";
import { NotificationIcons } from "./navigation/NotificationIcons";
import { UserMenu } from "./navigation/UserMenu";

const Navigation = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .maybeSingle();
        
        setIsAdmin(profile?.is_admin || false);
      }
    };
    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
      checkAdmin();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchUnreadCounts = async () => {
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);

      const { count: notificationsCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      setUnreadMessages(messagesCount || 0);
      setUnreadNotifications(notificationsCount || 0);
    };

    fetchUnreadCounts();

    const messagesChannel = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        fetchUnreadCounts
      )
      .subscribe();

    const notificationsChannel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        fetchUnreadCounts
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <>
      <nav className="fixed w-full top-0 z-50">
        <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="text-2xl font-serif font-bold text-slate-800 hover:text-slate-700 transition-colors">
                Thoughtscape
              </Link>
              
              {userId ? (
                <div className="flex items-center gap-6">
                  <Link to="/" className="text-slate-600 hover:text-slate-900 transition-colors">
                    <Home className="h-5 w-5" />
                  </Link>
                  <Link to="/explore" className="text-slate-600 hover:text-slate-900 transition-colors">
                    <Compass className="h-5 w-5" />
                  </Link>
                  <Link to="/write" className="text-slate-600 hover:text-slate-900 transition-colors">
                    <PenTool className="h-5 w-5" />
                  </Link>
                  <NotificationIcons
                    unreadMessages={unreadMessages}
                    unreadNotifications={unreadNotifications}
                  />
                  <UserMenu
                    userId={userId}
                    isAdmin={isAdmin}
                    onLogout={handleLogout}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link to="/auth">
                    <Button 
                      variant="outline" 
                      className="border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Login
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <div className="h-16" />
    </>
  );
};

export default Navigation;
