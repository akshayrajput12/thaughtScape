
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { UserNav } from "@/components/UserNav";
import { Home, Search, PenSquare, Briefcase } from "lucide-react";

const Navigation = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated && location.pathname === '/') {
    return null;
  }

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold">
              ThoughtScape
            </Link>
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-6">
                <Link to="/home" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <Home className="h-5 w-5" />
                  Home
                </Link>
                <Link to="/explore" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <Search className="h-5 w-5" />
                  Explore
                </Link>
                <Link to="/write" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <PenSquare className="h-5 w-5" />
                  Write
                </Link>
                <Link to="/freelancing" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <Briefcase className="h-5 w-5" />
                  Jobs
                </Link>
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
  );
};

export default Navigation;
