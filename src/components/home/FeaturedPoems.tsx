
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { PoemCard } from "@/components/PoemCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Thought } from "@/types";

interface FeaturedPoemsProps {
  thoughts: Thought[];
  currentUserId?: string;
  isAdmin: boolean;
  onDeleteThought: (thoughtId: string) => void;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export const FeaturedPoems = ({ 
  thoughts, 
  currentUserId, 
  isAdmin, 
  onDeleteThought,
  hasMore,
  isLoading,
  onLoadMore 
}: FeaturedPoemsProps) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [isIntersecting, hasMore, isLoading, onLoadMore]);

  return (
    <section className="container max-w-4xl px-4 py-8 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl font-serif font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
          Featured Thoughts
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover meaningful reflections shared by our thoughtful community
        </p>
      </motion.div>

      <div className="grid gap-8 md:gap-10">
        {thoughts?.map((thought, index) => (
          <motion.div
            key={thought.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <PoemCard
              poem={thought}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onDelete={onDeleteThought}
            />
          </motion.div>
        ))}
      </div>

      <div ref={loadMoreRef} className="mt-8 flex justify-center">
        {isLoading && (
          <div className="space-y-4 w-full">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        )}
      </div>
    </section>
  );
};
