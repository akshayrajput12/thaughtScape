
import { Heart, Bookmark, Share2, Link as LinkIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface PoemInteractionButtonsProps {
  likesCount: number;
  bookmarksCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
  onShare?: () => void;
  thoughtId?: string;
  showAnimation?: boolean;
}

export const PoemInteractionButtons = ({
  likesCount,
  bookmarksCount,
  isLiked,
  isBookmarked,
  onLike,
  onBookmark,
  onShare,
  thoughtId,
  showAnimation = false
}: PoemInteractionButtonsProps) => {
  const ButtonWrapper = showAnimation ? motion.button : 'button';
  const { toast } = useToast();

  const handleCopyLink = () => {
    if (!thoughtId) return;

    const url = `${window.location.origin}/thought/${thoughtId}`;
    navigator.clipboard.writeText(url);

    toast({
      description: "Link copied to clipboard",
    });
  };

  return (
    <div className="flex items-center gap-6">
      <ButtonWrapper
        className={`flex items-center gap-1.5 transition-colors ${
          isLiked ? 'text-red-500' : 'hover:text-red-500'
        }`}
        onClick={onLike}
        {...(showAnimation && { whileHover: { scale: 1.1 } })}
      >
        <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
        <span className="text-sm font-medium">{likesCount}</span>
      </ButtonWrapper>
      <ButtonWrapper
        className={`flex items-center gap-1.5 transition-colors ${
          isBookmarked ? 'text-primary' : 'hover:text-primary'
        }`}
        onClick={onBookmark}
        {...(showAnimation && { whileHover: { scale: 1.1 } })}
      >
        <Bookmark className={`w-6 h-6 ${isBookmarked ? 'fill-current' : ''}`} />
        <span className="text-sm font-medium">{bookmarksCount}</span>
      </ButtonWrapper>
      {onShare && (
        <ButtonWrapper
          className="hover:text-primary transition-colors"
          onClick={onShare}
          {...(showAnimation && { whileHover: { scale: 1.1 } })}
        >
          <Share2 className="w-6 h-6" />
        </ButtonWrapper>
      )}
      {thoughtId && (
        <ButtonWrapper
          className="hover:text-primary transition-colors ml-auto"
          onClick={handleCopyLink}
          {...(showAnimation && { whileHover: { scale: 1.1 } })}
        >
          <LinkIcon className="w-5 h-5" />
        </ButtonWrapper>
      )}
    </div>
  );
};
