import { motion } from "framer-motion";
import { Users, BookText, UserPlus } from "lucide-react";

interface ProfileStatsProps {
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

export const ProfileStats = ({ postsCount, followersCount, followingCount }: ProfileStatsProps) => {
  const stats = [
    {
      label: "Posts",
      value: postsCount,
      icon: BookText,
    },
    {
      label: "Followers",
      value: followersCount,
      icon: Users,
    },
    {
      label: "Following",
      value: followingCount,
      icon: UserPlus,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-accent rounded-lg mb-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-sm"
        >
          <stat.icon className="w-5 h-5 mb-2 text-primary" />
          <span className="text-2xl font-bold text-gray-800">{stat.value}</span>
          <span className="text-sm text-gray-500">{stat.label}</span>
        </motion.div>
      ))}
    </div>
  );
};