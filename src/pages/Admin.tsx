import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersList } from "@/components/admin/UsersList";
import { PoemsList } from "@/components/admin/PoemsList";
import { ProjectsList } from "@/components/admin/ProjectsList";

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

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
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 text-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-8 border border-gray-200">
          <h1 className="text-4xl font-serif font-bold mb-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="w-full bg-gray-50 p-1.5 rounded-xl grid grid-cols-3 gap-2">
              <TabsTrigger 
                value="users" 
                className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 
                         data-[state=active]:shadow-md transition-all duration-300 rounded-lg py-3"
              >
                Users
              </TabsTrigger>
              <TabsTrigger 
                value="thoughts" 
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 
                         data-[state=active]:shadow-md transition-all duration-300 rounded-lg py-3"
              >
                Thoughts
              </TabsTrigger>
              <TabsTrigger 
                value="projects" 
                className="data-[state=active]:bg-white data-[state=active]:text-pink-600 
                         data-[state=active]:shadow-md transition-all duration-300 rounded-lg py-3"
              >
                Projects
              </TabsTrigger>
            </TabsList>

            <div className="mt-8 space-y-6">
              <TabsContent value="users" className="focus-visible:outline-none focus-visible:ring-0">
                <UsersList />
              </TabsContent>

              <TabsContent value="thoughts" className="focus-visible:outline-none focus-visible:ring-0">
                <PoemsList />
              </TabsContent>

              <TabsContent value="projects" className="focus-visible:outline-none focus-visible:ring-0">
                <ProjectsList />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Admin;