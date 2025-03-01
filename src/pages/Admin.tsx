import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersList } from "@/components/admin/UsersList";
import { PoemsList } from "@/components/admin/PoemsList";

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
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold mb-8">Admin Dashboard</h1>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
          <TabsTrigger value="poems" className="flex-1">Poems</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersList />
        </TabsContent>

        <TabsContent value="poems">
          <PoemsList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;