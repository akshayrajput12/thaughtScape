import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface HeroProps {
  onActionClick: () => void;
  isLoggedIn: boolean;
}

export const Hero = ({ onActionClick, isLoggedIn }: HeroProps) => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="container relative px-4 pt-32 pb-24 text-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent -z-10" />
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-7xl font-serif font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
          Where Words Take Flight
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          Join our community of poets and poetry enthusiasts. Share your verses, discover new voices, 
          and connect through the power of words.
        </p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            className="group bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 text-primary-foreground px-8 py-6 rounded-full text-lg shadow-lg hover:shadow-xl transition-all"
            onClick={onActionClick}
          >
            <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
            {!isLoggedIn ? "Join Now" : "Start Writing"}
          </Button>
        </motion.div>
      </motion.div>
    </motion.section>
  );
};