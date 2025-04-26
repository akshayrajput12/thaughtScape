
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  followers: Profile[];
  onShare: (followerId: string) => void;
  thoughtId?: string; // Added thoughtId as optional prop
}

export const ShareDialog = ({ open, onOpenChange, followers = [], onShare }: ShareDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-serif">Share Thought</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {followers.length === 0 ? (
            <p className="text-center text-gray-500">You're not following anyone yet</p>
          ) : (
            followers.map((follower) => (
              <Button
                key={follower.id}
                variant="outline"
                className="flex items-center gap-3 w-full p-4 hover:bg-purple-50 transition-colors"
                onClick={() => onShare(follower.id)}
              >
                <img
                  src={follower.avatar_url || '/placeholder.svg'}
                  alt={follower.username}
                  className="w-10 h-10 rounded-full"
                />
                <span className="font-medium">{follower.full_name || follower.username}</span>
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
