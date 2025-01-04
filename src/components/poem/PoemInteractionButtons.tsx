import { Heart, Bookmark, Share2 } from "lucide-react";
import { motion } from "framer-motion";

interface PoemInteractionButtonsProps {
  likesCount: number;
  bookmarksCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
  showAnimation?: boolean;
}

export const PoemInteractionButtons = ({
  likesCount,
  bookmarksCount,
  isLiked,
  isBookmarked,
  onLike,
  onBookmark,
  showAnimation = false
}: PoemInteractionButtonsProps) => {
  const ButtonWrapper = showAnimation ? motion.button : 'button';

  return (
    <div className="flex items-center gap-4">
      <ButtonWrapper
        className={`flex items-center gap-1 transition-colors ${
          isLiked ? 'text-red-500' : 'hover:text-red-500'
        }`}
        onClick={onLike}
        {...(showAnimation && { whileHover: { scale: 1.1 } })}
      >
        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
        <span>{likesCount}</span>
      </ButtonWrapper>
      <ButtonWrapper
        className={`flex items-center gap-1 transition-colors ${
          isBookmarked ? 'text-blue-500' : 'hover:text-blue-500'
        }`}
        onClick={onBookmark}
        {...(showAnimation && { whileHover: { scale: 1.1 } })}
      >
        <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
        <span>{bookmarksCount}</span>
      </ButtonWrapper>
      <ButtonWrapper
        className="hover:text-gray-700 transition-colors"
        {...(showAnimation && { whileHover: { scale: 1.1 } })}
      >
        <Share2 className="w-5 h-5" />
      </ButtonWrapper>
    </div>
  );
};