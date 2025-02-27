
import { Heart, Bookmark, Share2, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

interface PoemInteractionButtonsProps {
  likesCount: number;
  bookmarksCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
  onShare?: () => void;
  showAnimation?: boolean;
}

export const PoemInteractionButtons = ({
  likesCount,
  bookmarksCount,
  commentsCount,
  isLiked,
  isBookmarked,
  onLike,
  onBookmark,
  onShare,
  showAnimation = false
}: PoemInteractionButtonsProps) => {
  const ButtonWrapper = showAnimation ? motion.button : 'button';

  return (
    <div className="flex items-center gap-4">
      <ButtonWrapper
        className={`flex items-center gap-1.5 transition-colors ${
          isLiked ? 'text-pink-500' : 'hover:text-pink-500'
        }`}
        onClick={onLike}
        {...(showAnimation && { whileHover: { scale: 1.1 } })}
      >
        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
        <span className="text-sm font-medium">{likesCount}</span>
      </ButtonWrapper>
      
      <ButtonWrapper
        className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
        {...(showAnimation && { whileHover: { scale: 1.1 } })}
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm font-medium">{commentsCount}</span>
      </ButtonWrapper>

      <ButtonWrapper
        className={`flex items-center gap-1.5 transition-colors ${
          isBookmarked ? 'text-purple-500' : 'hover:text-purple-500'
        }`}
        onClick={onBookmark}
        {...(showAnimation && { whileHover: { scale: 1.1 } })}
      >
        <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
        <span className="text-sm font-medium">{bookmarksCount}</span>
      </ButtonWrapper>

      {onShare && (
        <ButtonWrapper
          className="hover:text-purple-500 transition-colors flex items-center gap-1.5"
          onClick={onShare}
          {...(showAnimation && { whileHover: { scale: 1.1 } })}
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-medium">Share</span>
        </ButtonWrapper>
      )}
    </div>
  );
};
