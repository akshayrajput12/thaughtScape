
import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

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
        className="whitespace-pre-line text-gray-700 leading-relaxed font-serif"
      >
        {processContent(displayContent)}
      </motion.p>

      {isLongContent && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={`mt-2 px-3 py-1 rounded-md text-sm font-medium ${
            expanded
              ? "text-purple-500 hover:text-purple-700"
              : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600"
          } transition-colors`}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
};
