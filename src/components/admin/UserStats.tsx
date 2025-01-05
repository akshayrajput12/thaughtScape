interface UserStatsProps {
  followersCount: number;
  followingCount: number;
}

export function UserStats({ followersCount, followingCount }: UserStatsProps) {
  return (
    <div className="mt-2 text-sm text-gray-600">
      <p>Followers: {followersCount || 0}</p>
      <p>Following: {followingCount || 0}</p>
    </div>
  );
}