import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/types";
import { Switch } from "@/components/ui/switch";

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

    fetchUsers();
  };

  const toggleProfileCompletion = async (userId: string, currentStatus: boolean | null) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_profile_completed: !currentStatus })
      .eq('id', userId);

    if (error) {
      toast({
        title: "Error",
        description: "Could not update profile completion status",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Profile completion status updated successfully",
    });

    fetchUsers();
  };

  return (
    <div className="space-y-4">
      <Button onClick={fetchUsers}>Fetch Users</Button>
      <div className="grid gap-4">
        {users.map((user) => (
          <div key={user.id} className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
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
            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Profile Status</p>
                <p className="text-sm text-gray-500">
                  {user.is_profile_completed ? "Completed" : "Incomplete"}
                </p>
              </div>
              <Switch
                checked={user.is_profile_completed || false}
                onCheckedChange={() => toggleProfileCompletion(user.id, user.is_profile_completed)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}