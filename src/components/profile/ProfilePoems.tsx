
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PoemContent } from "@/components/poem/PoemContent";
import type { Thought } from "@/types";

interface ProfilePoemsProps {
  poems: Thought[];
  isOwnProfile: boolean;
  isAdmin: boolean;
  onDeletePoem: (poemId: string) => void;
}

export const ProfilePoems = ({ poems, isOwnProfile, isAdmin, onDeletePoem }: ProfilePoemsProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif font-bold text-gray-800">Thoughts</h2>
      {poems.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No thoughts yet</p>
      ) : (
        <div className="grid gap-6">
          {poems.map((poem, index) => (
            <motion.div
              key={poem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-serif font-semibold text-gray-800">{poem.title}</h3>
                {(isOwnProfile || isAdmin) && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeletePoem(poem.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="mb-4">
                <PoemContent 
                  content={poem.content} 
                  acceptedTags={poem.accepted_tags || []}
                />
              </div>
              <div className="text-sm text-gray-500">
                {new Date(poem.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
