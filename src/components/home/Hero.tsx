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
          {[
            "photo-1472396961693-142e6e269027",
            "photo-1498936178812-4b2e558d2937",
            "photo-1485833077593-4278bba3f11f",
            "photo-1441057206919-63d19fac2369",
            "photo-1469041797191-50ace28483c3",
            "photo-1452378174528-3090a4bba7b2"
          ].map((imageId, i) => (
            <div
              key={i}
              className="relative group overflow-hidden rounded-lg transition-all hover:scale-105"
            >
              <img
                src={`https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=800&q=80`}
                alt={`Inspiration ${i + 1}`}
                className="w-full h-48 object-cover transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white text-sm font-medium truncate">Discover inspiring poetry</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ContainerScroll>
    </div>
  );
};