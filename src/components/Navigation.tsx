
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Home, PenTool, Search, Menu, Briefcase } from "lucide-react";
import { NotificationIcons } from "./navigation/NotificationIcons";
import { UserMenu } from "./navigation/UserMenu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Navigation = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();

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
      try {
        // Get unread messages count
        const { count: messagesCount, error: messagesError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', userId)
          .eq('is_read', false);

        if (messagesError) {
          console.error("Error fetching unread messages:", messagesError);
        }

        // Get unread notifications count
        const { count: notificationsCount, error: notificationsError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false);

        if (notificationsError) {
          console.error("Error fetching unread notifications:", notificationsError);
        }

        setUnreadMessages(messagesCount || 0);
        setUnreadNotifications(notificationsCount || 0);
      } catch (error) {
        console.error("Error in fetchUnreadCounts:", error);
      }
    };

    fetchUnreadCounts();

    // Subscribe to real-time updates for messages
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

    // Subscribe to real-time updates for notifications
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

  const NavLinks = () => (
    <>
      <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-all duration-300 py-2 px-3 rounded-lg hover:bg-slate-100">
        <Home className="h-5 w-5" />
        <span className="lg:sr-only md:not-sr-only">Home</span>
      </Link>
      <Link to="/explore" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-all duration-300 py-2 px-3 rounded-lg hover:bg-slate-100">
        <Search className="h-5 w-5" />
        <span className="lg:sr-only md:not-sr-only">Explore</span>
      </Link>
      <Link to="/write" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-all duration-300 py-2 px-3 rounded-lg hover:bg-slate-100">
        <PenTool className="h-5 w-5" />
        <span className="lg:sr-only md:not-sr-only">Write</span>
      </Link>
      <Link to="/freelancing" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-all duration-300 py-2 px-3 rounded-lg hover:bg-slate-100">
        <Briefcase className="h-5 w-5" />
        <span className="lg:sr-only md:not-sr-only">Freelancing</span>
      </Link>
    </>
  );

  return (
    <>
      <nav className="fixed w-full top-0 z-50 transition-all duration-300 ease-in-out">
        <div className="bg-gradient-to-r from-white/90 via-[#E5DEFF]/90 to-white/90 backdrop-blur-md shadow-lg border-b border-slate-200/50 transition-all duration-300">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16 md:h-20 transition-all duration-300 ease-in-out">
              <div className="flex lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden hover:bg-[#E5DEFF]/50 transition-all duration-300 transform hover:scale-105">
                      <Menu className="h-5 w-5 text-slate-700" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                    <div className="flex flex-col h-full">
                      <Link to="/" className="text-2xl font-serif font-bold text-slate-800 mb-8">
                        Thoughtscape
                      </Link>
                      <nav className="flex flex-col gap-2">
                        <Link to="/" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-all duration-300 py-3 px-4 rounded-lg hover:bg-slate-100">
                          <Home className="h-5 w-5" />
                          <span>Home</span>
                        </Link>
                        <Link to="/explore" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-all duration-300 py-3 px-4 rounded-lg hover:bg-slate-100">
                          <Search className="h-5 w-5" />
                          <span>Explore</span>
                        </Link>
                        <Link to="/write" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-all duration-300 py-3 px-4 rounded-lg hover:bg-slate-100">
                          <PenTool className="h-5 w-5" />
                          <span>Write</span>
                        </Link>
                        <Link to="/freelancing" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-all duration-300 py-3 px-4 rounded-lg hover:bg-slate-100">
                          <Briefcase className="h-5 w-5" />
                          <span>Freelancing</span>
                        </Link>
                      </nav>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <Link to="/" className="text-xl md:text-2xl font-serif font-bold bg-gradient-to-r from-[#2D3748] via-[#6B7280] to-[#2D3748] bg-clip-text text-transparent hover:opacity-80 transition-all duration-300 transform hover:scale-105">
                Thoughtscape
              </Link>
              
              {userId ? (
                <div className="flex items-center gap-2 md:gap-6">
                  <div className="hidden md:flex md:items-center md:gap-1 lg:gap-2">
                    <NavLinks />
                  </div>
                  <NotificationIcons
                    unreadMessages={unreadMessages}
                    unreadNotifications={unreadNotifications}
                    userId={userId}
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
                      size="sm"
                      className="border-[#E5DEFF] bg-white/80 text-slate-700 hover:bg-[#E5DEFF]/30 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
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
      <div className="h-16 md:h-20" />
    </>
  );
};

export default Navigation;
