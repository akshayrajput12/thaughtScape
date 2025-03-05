
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, BookText, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";

interface ProfileStatsProps {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  userId: string;
}

export const ProfileStats = ({ postsCount, followersCount, followingCount, userId }: ProfileStatsProps) => {
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);
  const navigate = useNavigate();

  const fetchFollowers = async () => {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower:profiles!follows_follower_id_fkey(
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('following_id', userId);

    if (!error && data) {
      const followerProfiles = data.map(d => d.follower as Profile).filter(Boolean);
      setFollowers(followerProfiles);
    } else {
      console.error('Error fetching followers:', error);
    }
  };

  const fetchFollowing = async () => {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following:profiles!follows_following_id_fkey(
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('follower_id', userId);

    if (!error && data) {
      const followingProfiles = data.map(d => d.following as Profile).filter(Boolean);
      setFollowing(followingProfiles);
    } else {
      console.error('Error fetching following:', error);
    }
  };

  const handleFollowersClick = () => {
    fetchFollowers();
    setShowFollowersDialog(true);
  };

  const handleFollowingClick = () => {
    fetchFollowing();
    setShowFollowingDialog(true);
  };

  const stats = [
    {
      label: "Posts",
      value: postsCount,
      icon: BookText,
      onClick: null,
    },
    {
      label: "Followers",
      value: followersCount,
      icon: Users,
      onClick: handleFollowersClick,
    },
    {
      label: "Following",
      value: followingCount,
      icon: UserPlus,
      onClick: handleFollowingClick,
    },
  ];

  const UserList = ({ users }: { users: Profile[] }) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
      {users.length === 0 ? (
        <div className="text-center p-4 text-gray-500">
          No users to display
        </div>
      ) : (
        users.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            onClick={() => {
              navigate(`/profile/${user.id}`);
              setShowFollowersDialog(false);
              setShowFollowingDialog(false);
            }}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback>{user.username ? user.username[0].toUpperCase() : 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.full_name || user.username}</p>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${
              stat.onClick ? 'cursor-pointer hover:bg-gray-50' : ''
            }`}
            onClick={stat.onClick || undefined}
          >
            <stat.icon className="w-6 h-6 mb-2 text-primary" />
            <span className="text-3xl font-bold text-gray-800">{stat.value}</span>
            <span className="text-sm text-gray-500">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      <Dialog open={showFollowersDialog} onOpenChange={setShowFollowersDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
          </DialogHeader>
          <UserList users={followers} />
        </DialogContent>
      </Dialog>

      <Dialog open={showFollowingDialog} onOpenChange={setShowFollowingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Following</DialogTitle>
          </DialogHeader>
          <UserList users={following} />
        </DialogContent>
      </Dialog>
    </>
  );
};
