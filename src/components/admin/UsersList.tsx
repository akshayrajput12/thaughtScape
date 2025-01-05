import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/types";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EditUserForm } from "./EditUserForm";
import { UserStats } from "./UserStats";

export function UsersList() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
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

  const handleEditSubmit = async (formData: FormData) => {
    if (!editingUser) return;

    const updates = {
      username: String(formData.get('username')),
      full_name: String(formData.get('full_name')),
      bio: String(formData.get('bio')),
      age: formData.get('age') ? parseInt(String(formData.get('age'))) : null,
      country: String(formData.get('country')),
      state: String(formData.get('state')),
      city: String(formData.get('city')),
      avatar_url: String(formData.get('avatar_url')),
      is_profile_completed: formData.get('is_profile_completed') === 'true',
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', editingUser.id);

    if (error) {
      toast({
        title: "Error",
        description: "Could not update user profile",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "User profile updated successfully",
    });

    setEditingUser(null);
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
                <UserStats 
                  followersCount={user.followers_count || 0}
                  followingCount={user.following_count || 0}
                />
              </div>
              <div className="space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => setEditingUser(user)}>
                      Edit User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Edit User Profile</DialogTitle>
                    </DialogHeader>
                    {editingUser && (
                      <EditUserForm 
                        user={editingUser} 
                        onSubmit={handleEditSubmit}
                      />
                    )}
                  </DialogContent>
                </Dialog>
                <Button
                  variant={user.is_admin ? "destructive" : "default"}
                  onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                >
                  {user.is_admin ? "Remove Admin" : "Make Admin"}
                </Button>
              </div>
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