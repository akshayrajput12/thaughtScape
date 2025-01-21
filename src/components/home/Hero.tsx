import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface HeroProps {
  onActionClick: () => void;
  isLoggedIn: boolean;
}

export const Hero = ({ onActionClick, isLoggedIn }: HeroProps) => {
  return (
    <div className="flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-4xl font-serif font-bold text-black dark:text-white mb-8">
              Welcome to <br />
              <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                Poetic Parley
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join our community of poets and poetry enthusiasts. Share your verses, discover new voices, 
              and connect through the power of words.
            </p>
            <Button
              className="group bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 text-primary-foreground px-8 py-6 rounded-full text-lg shadow-lg hover:shadow-xl transition-all"
              onClick={onActionClick}
            >
              <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
              {!isLoggedIn ? "Join Now" : "Start Writing"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-800 rounded-lg p-4 hover:shadow-xl transition-shadow"
            >
              <div className="h-32 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-md mb-4" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-zinc-700 rounded mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-zinc-700 rounded" />
            </div>
          ))}
        </div>
      </ContainerScroll>
    </div>
  );
};