import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface Poem {
  id: string;
  title: string;
  content: string;
  author: {
    username: string;
    full_name: string;
  };
  created_at: string;
}

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [poems, setPoems] = useState<Poem[]>([]);
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

    const fetchData = async () => {
      // Fetch users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      setUsers(usersData || []);

      // Fetch poems with author information
      const { data: poemsData } = await supabase
        .from('poems')
        .select(`
          *,
          author:profiles(username, full_name)
        `)
        .order('created_at', { ascending: false });
      
      setPoems(poemsData || []);
    };

    checkAdmin();
    fetchData();
  }, [toast]);

  const handleDeleteUser = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      toast({
        title: "Error",
        description: "Could not delete user",
        variant: "destructive",
      });
      return;
    }

    setUsers(users.filter(user => user.id !== userId));
    toast({
      title: "Success",
      description: "User deleted successfully",
    });
  };

  const handleDeletePoem = async (poemId: string) => {
    const { error } = await supabase
      .from('poems')
      .delete()
      .eq('id', poemId);

    if (error) {
      toast({
        title: "Error",
        description: "Could not delete poem",
        variant: "destructive",
      });
      return;
    }

    setPoems(poems.filter(poem => poem.id !== poemId));
    toast({
      title: "Success",
      description: "Poem deleted successfully",
    });
  };

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
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="poems">
          <div className="space-y-6">
            {poems.map((poem) => (
              <div key={poem.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-serif font-semibold">{poem.title}</h3>
                    <p className="text-sm text-gray-500">
                      by {poem.author.full_name} (@{poem.author.username})
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePoem(poem.id)}
                  >
                    Delete
                  </Button>
                </div>
                <p className="text-gray-700 whitespace-pre-line">{poem.content}</p>
                <div className="mt-4 text-sm text-gray-500">
                  {new Date(poem.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;