
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfile } from "@/contexts/ProfileContext";
import {
  Home,
  Search,
  PenSquare,
  Briefcase,
  User,
  Bell,
  LogOut,
  Settings
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { safeErrorLog } from "@/utils/sanitizeData";

const Navigation = () => {
  const { isAuthenticated, user } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const { toast } = useToast();

  // Fetch notifications data
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return { unreadNotifications: 0, unreadApplications: 0 };

      // Get unread notifications count
      const { count: notificationsCount } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      // Get user's projects
      const { data: userProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('author_id', user.id);

      let applicationsCount = 0;

      if (userProjects && userProjects.length > 0) {
        const projectIds = userProjects.map(p => p.id);

        // Get unviewed applications count
        const { count } = await supabase
          .from('project_applications')
          .select('id', { count: 'exact', head: true })
          .is('viewed_at', null)
          .in('project_id', projectIds);

        applicationsCount = count || 0;
      }

      return {
        unreadNotifications: notificationsCount || 0,
        unreadApplications: applicationsCount
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (user?.id) {
      const notificationsChannel = supabase
        .channel('notifications_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            // Invalidate the notifications query to trigger a refetch
            // This would be handled by React Query's invalidation
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notificationsChannel);
      };
    }
  }, [user?.id]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account",
      });
      navigate('/');
    } catch (error) {
      safeErrorLog("Error signing out", error);
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Enhanced UserNav component
  const UserNav = () => {
    const totalUnread = (notificationsData?.unreadNotifications || 0) + (notificationsData?.unreadApplications || 0);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
            <Avatar className="h-8 w-8">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.username || "User"} />
              ) : (
                <AvatarFallback>{profile?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
              )}
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{profile?.full_name || profile?.username}</p>
              <p className="text-xs leading-none text-muted-foreground">@{profile?.username}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile/' + profile?.id)} className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/notifications')} className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            {notificationsData?.unreadNotifications > 0 && (
              <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1 flex items-center justify-center">
                {notificationsData.unreadNotifications}
              </Badge>
            )}
          </DropdownMenuItem>
          {profile?.is_admin && (
            <DropdownMenuItem onClick={() => navigate('/admin')} className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Admin Dashboard</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-red-500">
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Always show navigation for authenticated users
  // For non-authenticated users, show on landing page and auth page
  if (!isAuthenticated && location.pathname !== '/' && location.pathname !== '/auth') {
    return null;
  }

  const navItems = [
    { path: "/home", icon: <Home className="h-5 w-5" />, label: "Home" },
    { path: "/explore", icon: <Search className="h-5 w-5" />, label: "Explore" },
    { path: "/write", icon: <PenSquare className="h-5 w-5" />, label: "Write" },
    {
      path: "/freelancing",
      icon: (
        <div className="relative">
          <Briefcase className="h-5 w-5" />
          {notificationsData?.unreadApplications > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-medium text-white">
              {notificationsData.unreadApplications > 9 ? '9+' : notificationsData.unreadApplications}
            </span>
          )}
        </div>
      ),
      label: "Jobs"
    },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur-sm hidden md:block sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link
                to="/"
                className="relative group flex items-center"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(isAuthenticated ? '/home' : '/');
                }}
              >
                <div className="relative overflow-hidden rounded-md group-hover:shadow-md transition-all duration-300">
                  <img
                    src="/logo.png"
                    alt="CampusCash Logo"
                    className="h-8 w-auto object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-secondary/0 group-hover:from-primary/10 group-hover:to-secondary/10 transition-all duration-500"></div>
                </div>
                <span className="ml-2 text-xl font-bold relative z-10 text-gray-900 dark:text-white">
                  CampusCash
                </span>
                <span className="absolute -inset-x-2 -inset-y-1 z-0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-lg bg-black/5 dark:bg-white/10"></span>
                <span className="absolute -bottom-1 left-0 h-0.5 w-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left bg-gradient-to-r from-primary to-secondary"></span>
              </Link>
              {isAuthenticated && (
                <div className="flex items-center gap-6">
                  {navItems.map(item => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 hover:text-foreground transition-colors relative py-1 ${
                        location.pathname === item.path
                          ? 'text-foreground font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/notifications"
                    className="relative inline-flex items-center justify-center rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    {notificationsData?.unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                        {notificationsData.unreadNotifications > 9 ? '9+' : notificationsData.unreadNotifications}
                      </span>
                    )}
                  </Link>
                  <UserNav />
                </div>
              ) : (
                <Button onClick={() => navigate('/auth')} className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Top Bar for Logo */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border md:hidden z-10 py-3 px-4 flex justify-between items-center">
          <Link
            to="/"
            className="relative group flex items-center"
            onClick={(e) => {
              e.preventDefault();
              navigate(isAuthenticated ? '/home' : '/');
            }}
          >
            <div className="relative overflow-hidden rounded-md group-hover:shadow-md transition-all duration-300">
              <img
                src="/logo.png"
                alt="CampusCash Logo"
                className="h-7 w-auto object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-secondary/0 group-hover:from-primary/10 group-hover:to-secondary/10 transition-all duration-500"></div>
            </div>
            <span className="ml-2 text-lg font-bold relative z-10 text-gray-900 dark:text-white">
              CampusCash
            </span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                to="/notifications"
                className="relative inline-flex items-center justify-center rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Bell className="h-5 w-5" />
                {notificationsData?.unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                    {notificationsData.unreadNotifications > 9 ? '9+' : notificationsData.unreadNotifications}
                  </span>
                )}
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                size="sm"
                onClick={() => navigate('/auth')}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              >
                Sign In
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {isAuthenticated && isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border md:hidden z-10">
          <div className="flex justify-around py-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center p-2 ${location.pathname === item.path ? 'text-primary font-medium' : 'text-muted-foreground'}`}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            ))}
            <Link
              to="/notifications"
              className={`flex flex-col items-center p-2 relative ${location.pathname === '/notifications' ? 'text-primary font-medium' : 'text-muted-foreground'}`}
            >
              <div className="relative">
                <Bell className="h-5 w-5" />
                {notificationsData?.unreadNotifications > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-medium text-white">
                    {notificationsData.unreadNotifications > 9 ? '9+' : notificationsData.unreadNotifications}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">Alerts</span>
            </Link>
            <Link
              to={`/profile/${profile?.id}`}
              className={`flex flex-col items-center p-2 ${location.pathname.includes('/profile/') ? 'text-primary font-medium' : 'text-muted-foreground'}`}
            >
              <User className="h-5 w-5" />
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </div>
        </div>
      )}

      {/* Add padding to the page when mobile navigation is visible */}
      {isMobile && (
        <>
          {/* Top padding for mobile header */}
          <div className="h-14 md:h-0"></div>

          {/* Bottom padding for mobile footer navigation */}
          {isAuthenticated && <div className="h-16 md:h-0"></div>}
        </>
      )}
    </>
  );
};

export default Navigation;
