
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-purple-50/30">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-purple-100 shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-purple-700"
            >
              <Menu size={24} />
            </Button>
            <h1 className="font-bold text-xl bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut size={16} className="mr-1" />
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="flex overflow-x-auto scrollbar-hide border-t border-purple-100 bg-white">
          <button
            className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap transition-colors ${
              activeTab === 'users'
                ? 'text-purple-700 border-b-2 border-purple-700 font-medium'
                : 'text-gray-600 hover:text-purple-700'
            }`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            <span>Users</span>
          </button>

          <button
            className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap transition-colors ${
              activeTab === 'thoughts'
                ? 'text-purple-700 border-b-2 border-purple-700 font-medium'
                : 'text-gray-600 hover:text-purple-700'
            }`}
            onClick={() => setActiveTab('thoughts')}
          >
            <File size={18} />
            <span>Thoughts</span>
          </button>

          <button
            className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap transition-colors ${
              activeTab === 'projects'
                ? 'text-purple-700 border-b-2 border-purple-700 font-medium'
                : 'text-gray-600 hover:text-purple-700'
            }`}
            onClick={() => setActiveTab('projects')}
          >
            <Briefcase size={18} />
            <span>Projects</span>
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Desktop Only */}
        <div
          className={`h-screen bg-white border-r border-purple-100 shadow-lg transition-all duration-300 flex flex-col fixed lg:sticky top-0 z-30 ${
            sidebarOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full lg:w-20 lg:translate-x-0'
          }`}
        >
          <div className="p-5 border-b border-purple-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white">
                <LayoutDashboard size={18} />
              </div>
              <h1 className={`font-bold text-xl bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent transition-opacity duration-300 ${!sidebarOpen && 'lg:opacity-0 lg:w-0 lg:hidden'}`}>
                Admin Panel
              </h1>
            </div>
            <button
              className="text-gray-500 hover:text-purple-700 transition-colors p-2 rounded-full hover:bg-purple-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
            <button
              className="text-gray-500 hover:text-purple-700 transition-colors p-2 rounded-full hover:bg-purple-50 hidden lg:block"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4">
            <div className="mb-6">
              <p className={`text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 px-3 ${!sidebarOpen && 'lg:hidden'}`}>
                Main Menu
              </p>
              <nav className="space-y-1">
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'users'
                      ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 font-medium shadow-sm'
                      : 'text-gray-600 hover:bg-purple-50/50 hover:text-purple-700'
                  }`}
                  onClick={() => setActiveTab('users')}
                >
                  <Users size={20} className={activeTab === 'users' ? 'text-purple-600' : ''} />
                  <span className={`transition-opacity duration-300 ${!sidebarOpen && 'lg:hidden'}`}>Users</span>
                </button>

                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'thoughts'
                      ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 font-medium shadow-sm'
                      : 'text-gray-600 hover:bg-purple-50/50 hover:text-purple-700'
                  }`}
                  onClick={() => setActiveTab('thoughts')}
                >
                  <File size={20} className={activeTab === 'thoughts' ? 'text-purple-600' : ''} />
                  <span className={`transition-opacity duration-300 ${!sidebarOpen && 'lg:hidden'}`}>Thoughts</span>
                </button>

                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'projects'
                      ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 font-medium shadow-sm'
                      : 'text-gray-600 hover:bg-purple-50/50 hover:text-purple-700'
                  }`}
                  onClick={() => setActiveTab('projects')}
                >
                  <Briefcase size={20} className={activeTab === 'projects' ? 'text-purple-600' : ''} />
                  <span className={`transition-opacity duration-300 ${!sidebarOpen && 'lg:hidden'}`}>Projects</span>
                </button>
              </nav>
            </div>

            <div className="mt-6">
              <p className={`text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 px-3 ${!sidebarOpen && 'lg:hidden'}`}>
                Settings
              </p>
              <nav className="space-y-1">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-purple-50/50 hover:text-purple-700"
                >
                  <Settings size={20} />
                  <span className={`transition-opacity duration-300 ${!sidebarOpen && 'lg:hidden'}`}>Settings</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="p-4 border-t border-purple-100">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              <span className={`transition-opacity duration-300 ${!sidebarOpen && 'lg:hidden'}`}>Logout</span>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 transition-all">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between p-6 border-b border-purple-100 bg-white sticky top-0 z-20">
            <h1 className="text-2xl font-serif font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                className="text-purple-700 border-purple-200"
              >
                <Settings size={16} className="mr-2" />
                Settings
              </Button>
            </div>
          </div>

          <div className="p-4 md:p-6 lg:p-8">
            <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
              <div className="p-6 border-b border-purple-100 hidden lg:block">
                <div className="flex items-center gap-2">
                  {activeTab === 'users' && (
                    <h2 className="text-xl font-medium text-gray-900 flex items-center gap-2">
                      <Users size={20} className="text-purple-600" />
                      User Management
                    </h2>
                  )}
                  {activeTab === 'thoughts' && (
                    <h2 className="text-xl font-medium text-gray-900 flex items-center gap-2">
                      <File size={20} className="text-purple-600" />
                      Thoughts Management
                    </h2>
                  )}
                  {activeTab === 'projects' && (
                    <h2 className="text-xl font-medium text-gray-900 flex items-center gap-2">
                      <Briefcase size={20} className="text-purple-600" />
                      Projects Management
                    </h2>
                  )}
                </div>
              </div>

              <div className="p-4 md:p-6">
                {activeTab === 'users' && <UsersList />}
                {activeTab === 'thoughts' && <PoemsList />}
                {activeTab === 'projects' && <ProjectsList />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Admin;
