import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onActionClick: () => void;
  isLoggedIn: boolean;
}

export const Hero = ({ onActionClick, isLoggedIn }: HeroProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="container px-4 pt-24 pb-20 text-center"
    >
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-6xl font-serif font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600"
      >
        Where Words Take Flight
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
      >
        Join our community of poets and poetry enthusiasts. Share your verses, discover new voices, 
        and connect through the power of words.
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <Button
          className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground px-8 py-6 rounded-full text-lg shadow-lg hover:shadow-xl transition-all"
          onClick={onActionClick}
        >
          {!isLoggedIn ? "Join Now" : "Start Writing"}
        </Button>
      </motion.div>
    </motion.section>
  );
};