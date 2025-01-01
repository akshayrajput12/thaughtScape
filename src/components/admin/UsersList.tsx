import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/types";

const UsersList = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Could not fetch users",
          variant: "destructive",
        });
        return;
      }

      setUsers(usersData.map(user => ({
        ...user,
        is_profile_completed: user.is_profile_completed || false
      })));
    };

    fetchUsers();
  }, [toast]);

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !currentStatus })
      .eq('id', userId);

    if (error) {
      toast({
        title: "Error",
        description: "Could not update user status",
        variant: "destructive",
      });
      return;
    }

    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, is_admin: !currentStatus }
        : user
    ));

    toast({
      title: "Success",
      description: "User status updated successfully",
    });
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div>
                    <div className="font-medium text-gray-900">{user.full_name}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">@{user.username}</td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-right text-sm font-medium">
                <Button
                  variant={user.is_admin ? "destructive" : "default"}
                  onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                >
                  {user.is_admin ? "Remove Admin" : "Make Admin"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersList;