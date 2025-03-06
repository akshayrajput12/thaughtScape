
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface PoemContentProps {
  content: string;
  isLuxury?: boolean;
}

export const PoemContent = ({ content, isLuxury = false }: PoemContentProps) => {
  const [expanded, setExpanded] = useState(false);
  
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
        return (
          <Link 
            key={index} 
            to={`/profile/${username}`} 
            className="text-purple-500 hover:underline cursor-pointer"
          >
            {word}
          </Link>
        );
      }
      
      // Regular text
      return <span key={index}>{word}</span>;
    });
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
          className="mt-2 text-purple-500 text-sm font-medium hover:text-purple-700 transition-colors"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
};
