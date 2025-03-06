
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersList } from "@/components/admin/UsersList";
import { PoemsList } from "@/components/admin/PoemsList";
import { ProjectsList } from "@/components/admin/ProjectsList";
import { 
  Users, 
  File, 
  Briefcase, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Menu,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        
        setIsAdmin(profile?.is_admin || false);
        if (!profile?.is_admin) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page",
            variant: "destructive",
          });
        }
      }
    };

    checkAdmin();
  }, [toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/30 text-center max-w-md w-full">
          <h1 className="text-3xl font-bold text-red-400 mb-3">Access Denied</h1>
          <p className="text-gray-300">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div 
        className={`h-screen bg-gradient-to-b from-gray-900 to-purple-900 text-white shadow-xl transition-all duration-300 flex flex-col ${
          sidebarOpen ? 'w-64' : 'w-20'
        } fixed lg:relative z-10`}
      >
        <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
          <h1 className={`font-bold text-xl ${!sidebarOpen && 'hidden'}`}>Admin Panel</h1>
          <button 
            className="text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3">
          <nav className="space-y-2">
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'users' 
                  ? 'bg-purple-800 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              onClick={() => setActiveTab('users')}
            >
              <Users size={20} />
              {sidebarOpen && <span>Users</span>}
            </button>
            
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'thoughts' 
                  ? 'bg-purple-800 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              onClick={() => setActiveTab('thoughts')}
            >
              <File size={20} />
              {sidebarOpen && <span>Thoughts</span>}
            </button>
            
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'projects' 
                  ? 'bg-purple-800 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              onClick={() => setActiveTab('projects')}
            >
              <Briefcase size={20} />
              {sidebarOpen && <span>Projects</span>}
            </button>
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-700/50">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className={`flex-1 transition-all ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              
              <div className="lg:hidden">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu size={18} />
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {activeTab === 'users' && <UsersList />}
              {activeTab === 'thoughts' && <PoemsList />}
              {activeTab === 'projects' && <ProjectsList />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
