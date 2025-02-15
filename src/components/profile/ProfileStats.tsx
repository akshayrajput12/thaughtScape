
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
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";

interface ProfileStatsProps {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  userId: string;
}

export const ProfileStats = ({ postsCount, followersCount, followingCount, userId }: ProfileStatsProps) => {
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
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
      setFollowers(data.map(d => d.follower) as Profile[]);
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
      setFollowing(data.map(d => d.following) as Profile[]);
    }
  };

  const handleFollowersClick = async () => {
    await fetchFollowers();
    setShowFollowers(true);
  };

  const handleFollowingClick = async () => {
    await fetchFollowing();
    setShowFollowing(true);
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
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      {users.map((user) => (
        <motion.div
          key={user.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
          onClick={() => {
            navigate(`/profile/${user.id}`);
            setShowFollowers(false);
            setShowFollowing(false);
          }}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.full_name || user.username}</p>
            <p className="text-sm text-gray-500">@{user.username}</p>
          </div>
        </motion.div>
      ))}
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

      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
          </DialogHeader>
          <UserList users={followers} />
        </DialogContent>
      </Dialog>

      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
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
