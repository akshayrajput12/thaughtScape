
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { Home, Search, PenSquare, Briefcase, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";
import { useMobile } from "@/hooks/use-mobile";

const Navigation = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const isMobile = useMobile();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isAuthenticated) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      setUserProfile(data);
    };
    
    fetchUserProfile();
  }, [isAuthenticated]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Simple UserNav component
  const UserNav = () => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              {userProfile?.avatar_url ? (
                <AvatarImage src={userProfile.avatar_url} alt={userProfile.username || "User"} />
              ) : (
                <AvatarFallback>{userProfile?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
              )}
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userProfile?.full_name || userProfile?.username}</p>
              <p className="text-xs leading-none text-muted-foreground">@{userProfile?.username}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile/' + userProfile?.id)}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/notifications')}>
            Notifications
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (!isAuthenticated && location.pathname === '/') {
    return null;
  }

  const navItems = [
    { path: "/home", icon: <Home className="h-5 w-5" />, label: "Home" },
    { path: "/explore", icon: <Search className="h-5 w-5" />, label: "Explore" },
    { path: "/write", icon: <PenSquare className="h-5 w-5" />, label: "Write" },
    { path: "/freelancing", icon: <Briefcase className="h-5 w-5" />, label: "Jobs" },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="border-b bg-white hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-xl font-bold">
                ThoughtScape
              </Link>
              {isAuthenticated && (
                <div className="flex items-center gap-6">
                  {navItems.map(item => (
                    <Link 
                      key={item.path} 
                      to={item.path} 
                      className={`flex items-center gap-2 text-gray-600 hover:text-gray-900 ${location.pathname === item.path ? 'text-gray-900 font-medium' : ''}`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <UserNav />
              ) : (
                <Button onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile Bottom Navigation */}
      {isAuthenticated && isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-10">
          <div className="flex justify-around py-2">
            {navItems.map(item => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex flex-col items-center p-2 ${location.pathname === item.path ? 'text-primary-foreground font-medium' : 'text-gray-500'}`}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            ))}
            <Link 
              to={`/profile/${userProfile?.id}`} 
              className={`flex flex-col items-center p-2 ${location.pathname.includes('/profile/') ? 'text-primary-foreground font-medium' : 'text-gray-500'}`}
            >
              <User className="h-5 w-5" />
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
