import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/types";

export function UsersList() {
  const [users, setUsers] = useState<Profile[]>([]);
  const { toast } = useToast();

  const fetchUsers = async () => {
    const { data, error } = await supabase
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

    setUsers(data || []);
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean | null) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !currentStatus })
      .eq('id', userId);

    if (error) {
      toast({
        title: "Error",
        description: "Could not update admin status",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Admin status updated successfully",
    });

    // Refresh the users list
    fetchUsers();
  };

  return (
    <div className="space-y-4">
      <Button onClick={fetchUsers}>Fetch Users</Button>
      <div className="grid gap-4">
        {users.map((user) => (
          <div key={user.id} className="p-4 border rounded-lg flex items-center justify-between">
            <div>
              <p className="font-medium">{user.username}</p>
              <p className="text-sm text-gray-500">ID: {user.id}</p>
            </div>
            <Button
              variant={user.is_admin ? "destructive" : "default"}
              onClick={() => toggleAdminStatus(user.id, user.is_admin)}
            >
              {user.is_admin ? "Remove Admin" : "Make Admin"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}