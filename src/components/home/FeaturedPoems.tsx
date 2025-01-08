import { motion } from "framer-motion";
import { PoemCard } from "@/components/PoemCard";
import type { Poem } from "@/types";

interface FeaturedPoemsProps {
  poems: Poem[];
  currentUserId?: string;
  isAdmin: boolean;
  onDeletePoem: (poemId: string) => void;
}

export const FeaturedPoems = ({ poems, currentUserId, isAdmin, onDeletePoem }: FeaturedPoemsProps) => {
  return (
    <section className="container px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl font-serif font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
          Featured Poems
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover beautiful verses crafted by our talented community of poets
        </p>
      </motion.div>

      <div className="grid gap-8 md:gap-10 max-w-4xl mx-auto">
        {poems.map((poem, index) => (
          <motion.div
            key={poem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <PoemCard
              poem={poem}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onDelete={onDeletePoem}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
};