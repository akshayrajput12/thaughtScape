
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/types";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EditUserForm } from "./EditUserForm";
import { UserStats } from "./UserStats";
import { Trash2, UserCog, Shield, ShieldOff, RefreshCw } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function UsersList() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    setIsLoading(false);
    
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
  
  // Fixed the function to properly handle the FormData type
  const handleEditSubmit = async (formData: FormData) => {
    try {
      // Make sure we have the editing user
      if (!editingUser) return;
      
      // Extract values from form data
      const updatedUser = {
        ...editingUser,
        full_name: formData.get('full_name') as string || editingUser.full_name,
        username: formData.get('username') as string || editingUser.username,
        bio: formData.get('bio') as string || editingUser.bio,
        city: formData.get('city') as string || editingUser.city,
        country: formData.get('country') as string || editingUser.country,
        age: formData.get('age') ? Number(formData.get('age')) : editingUser.age
      };
  
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updatedUser.full_name,
          username: updatedUser.username,
          bio: updatedUser.bio,
          city: updatedUser.city,
          country: updatedUser.country,
          age: updatedUser.age
        })
        .eq('id', updatedUser.id);
  
      if (error) throw error;
  
      toast({
        title: "Success",
        description: "User profile updated successfully",
      });
  
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Could not update user profile",
        variant: "destructive",
      });
    }
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
  
  // Added the missing toggleAdminStatus function
  const toggleAdminStatus = async (userId: string, isCurrentlyAdmin: boolean | undefined) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !isCurrentlyAdmin })
        .eq('id', userId);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `User is ${!isCurrentlyAdmin ? 'now an admin' : 'no longer an admin'}`,
      });
      
      fetchUsers();
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast({
        title: "Error",
        description: "Could not update admin status",
        variant: "destructive",
      });
    }
  };
  
  // Add delete user functionality
  const deleteUser = async (userId: string) => {
    try {
      // First delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      // Remove the user from the UI
      setUsers(users.filter(user => user.id !== userId));
      
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Could not delete user",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <Button 
        onClick={fetchUsers}
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
        disabled={isLoading}
      >
        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        {isLoading ? "Loading..." : "Refresh Users List"}
      </Button>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <div 
            key={user.id} 
            className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {user.avatar_url && (
                      <img 
                        src={user.avatar_url} 
                        alt={user.username} 
                        className="w-10 h-10 rounded-full border-2 border-gray-100"
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                        {user.full_name || user.username}
                      </h3>
                      <p className="text-sm text-gray-600">{user.username}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{user.bio || 'No bio provided'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <UserStats 
                  followersCount={user.followers_count || 0}
                  followingCount={user.following_count || 0}
                />
                
                <div className="flex flex-wrap gap-2">
                  {user.country && (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                      {user.country}
                    </span>
                  )}
                  {user.city && (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                      {user.city}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Profile Status</p>
                  <p className="text-xs text-gray-500">
                    {user.is_profile_completed ? "Completed" : "Incomplete"}
                  </p>
                </div>
                <Switch
                  checked={user.is_profile_completed || false}
                  onCheckedChange={() => toggleProfileCompletion(user.id, user.is_profile_completed)}
                  className="data-[state=checked]:bg-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingUser(user)}
                      className="w-full bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      <UserCog className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white/95 backdrop-blur-xl border-gray-200 text-gray-800">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Edit User Profile
                      </DialogTitle>
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
                  variant={user.is_admin ? "outline" : "default"}
                  onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                  className={user.is_admin 
                    ? "w-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-red-200" 
                    : "w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 border-emerald-200"
                  }
                >
                  {user.is_admin ? (
                    <>
                      <ShieldOff className="w-4 h-4 mr-2" />
                      Remove Admin
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Make Admin
                    </>
                  )}
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-red-200"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the user
                        account and all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteUser(user.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
