
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Home, PenTool, Search, Menu, X } from "lucide-react";
import { NotificationIcons } from "./navigation/NotificationIcons";
import { UserMenu } from "./navigation/UserMenu";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/explore", icon: Search, label: "Explore" },
    { path: "/write", icon: PenTool, label: "Write" },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 z-50">
        <div className="flex items-center justify-between px-4 h-full">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <Link to="/" className="text-xl font-serif font-bold text-slate-800">
            Thoughtscape
          </Link>
          {userId ? (
            <UserMenu
              userId={userId}
              isAdmin={isAdmin}
              onLogout={handleLogout}
            />
          ) : (
            <Link to="/auth">
              <Button 
                variant="outline" 
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40",
          "lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Desktop Logo */}
          <div className="hidden lg:flex h-16 items-center px-6 border-b border-slate-200">
            <Link to="/" className="text-2xl font-serif font-bold text-slate-800">
              Thoughtscape
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 pt-16 lg:pt-6 px-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  "hover:bg-slate-100",
                  location.pathname === item.path ? "bg-slate-100 text-slate-900" : "text-slate-600"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}

            {userId && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <NotificationIcons
                  unreadMessages={unreadMessages}
                  unreadNotifications={unreadNotifications}
                />
              </div>
            )}
          </nav>

          {/* Mobile Login Button */}
          {!userId && (
            <div className="lg:hidden p-4 border-t border-slate-200">
              <Link to="/auth" className="w-full">
                <Button className="w-full">
                  Login
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className={cn(
        "min-h-screen transition-all duration-300",
        "pt-16 lg:pt-0 lg:pl-64"
      )}>
        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </div>
    </>
  );
};

export default Navigation;
