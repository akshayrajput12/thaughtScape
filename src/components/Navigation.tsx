import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Bell, MessageSquare, PenTool, User, LogOut } from "lucide-react";

const Navigation = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        setIsAdmin(profile?.is_admin || false);
      }
    };
    checkAdmin();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-serif font-bold">
            Poetic Parley
          </Link>
          
          {userId ? (
            <div className="flex items-center gap-4">
              <Link to="/write" className="text-gray-600 hover:text-gray-900">
                <PenTool className="h-6 w-6" />
              </Link>
              <Link to="/notifications" className="text-gray-600 hover:text-gray-900">
                <Bell className="h-6 w-6" />
              </Link>
              <Link to="/messages" className="text-gray-600 hover:text-gray-900">
                <MessageSquare className="h-6 w-6" />
              </Link>
              <Link to={`/profile/${userId}`} className="text-gray-600 hover:text-gray-900">
                <User className="h-6 w-6" />
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-sm font-medium text-primary-foreground bg-primary px-4 py-2 rounded-md">
                  Admin
                </Link>
              )}
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/auth">
                <Button variant="ghost">Login</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;