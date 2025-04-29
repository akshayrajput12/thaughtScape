
import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PoemContentProps {
  content: string;
  isLuxury?: boolean;
  acceptedTags?: string[];
}

export const PoemContent = ({ content, isLuxury = false, acceptedTags = [] }: PoemContentProps) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  // Process content to highlight hashtags and mentions
  const processContent = (text: string) => {
    // First, split by spaces to identify words
    const words = text.split(/(\s+)/);

    return words.map((word, index) => {
      // Handle hashtags
      if (word.startsWith('#')) {
        return (
          <span key={index} className="text-blue-500 hover:underline cursor-pointer">
            {word}
          </span>
        );
      }

      // Handle user mentions (@username)
      else if (word.startsWith('@')) {
        const username = word.substring(1); // Remove the @ symbol
        const isAccepted = acceptedTags?.includes(username);

        // Only show mentions that are accepted or don't have acceptedTags specified
        if (acceptedTags?.length === 0 || isAccepted) {
          return (
            <span
              key={index}
              onClick={() => handleProfileClick(username)}
              className="text-purple-500 hover:underline cursor-pointer font-medium"
            >
              {word}
            </span>
          );
        } else {
          // Return just normal text if the tag was not accepted
          return <span key={index}>{word.replace(`@${username}`, username)}</span>;
        }
      }

      // Regular text
      return <span key={index}>{word}</span>;
    });
  };

  const handleProfileClick = (username: string) => {
    // Navigate to user profile
    navigate(`/explore?search=${username}`);
  };

  const isLongContent = content.length > 300;
  const displayContent = expanded || !isLongContent ? content : `${content.substring(0, 300)}...`;

  return (
    <div className={`poem-content prose prose-lg max-w-none ${isLuxury ? 'luxury-content' : ''}`}>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "whitespace-pre-line text-gray-700 dark:text-gray-300 leading-relaxed font-serif",
          !expanded && isLongContent && "line-clamp-3"
        )}
      >
        {processContent(expanded ? content : displayContent)}
      </motion.p>

      {isLongContent && (
        <Button
          variant={expanded ? "ghost" : "secondary"}
          size="sm"
          className={cn(
            "mt-2 h-8 text-xs px-4 font-medium shadow-sm",
            expanded
              ? "text-muted-foreground hover:text-foreground"
              : "bg-gradient-to-r from-blue-500/90 to-indigo-500/90 hover:from-blue-600 hover:to-indigo-600 text-white dark:from-blue-600/90 dark:to-indigo-600/90"
          )}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
              Read More
            </>
          )}
        </Button>
      )}
    </div>
  );
};
