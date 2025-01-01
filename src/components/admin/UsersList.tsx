import { useState, useEffect } from "react";
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
        is_profile_completed: user.is_profile_completed || false,
        is_admin: user.is_admin || false
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
    <div className="space-y-4">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
        >
          <div>
            <h3 className="font-medium">{user.full_name || user.username}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <Button
            variant={user.is_admin ? "destructive" : "default"}
            onClick={() => handleToggleAdmin(user.id, user.is_admin)}
          >
            {user.is_admin ? "Remove Admin" : "Make Admin"}
          </Button>
        </div>
      ))}
    </div>
  );
};

export default UsersList;