
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { RevealImageList } from "@/components/ui/reveal-images";
import { Button } from "@/components/ui/button";
import { LightbulbIcon } from "lucide-react";
import { GooeyText } from "@/components/ui/gooey-text-morphing";

interface HeroProps {
  onActionClick: () => void;
  isLoggedIn: boolean;
}

export const Hero = ({ onActionClick, isLoggedIn }: HeroProps) => {
  return (
    <div className="flex flex-col overflow-hidden -mt-8 pt-32">
      <ContainerScroll
        titleComponent={
          <>
            <div className="space-y-6 md:space-y-8 mt-8 md:mt-12">
              <h1 className="text-3xl md:text-4xl font-serif font-bold relative mt-[150px] z-0 text-center">
                Welcome to
              </h1>
              <div className="h-24 md:h-32 flex items-center justify-center">
                <GooeyText
                  texts={["Thoughtscape", "Creativity", "Expression", "Connection"]}
                  morphTime={1.5}
                  cooldownTime={1}
                  className="font-serif w-full"
                  textClassName="bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-slate-600 to-slate-900 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[80pt] font-bold"
                />
              </div>
            </div>
            <p className="text-lg md:text-xl mt-8 text-slate-600 dark:text-slate-300 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed relative z-10 text-center px-4">
              A serene space for sharing your thoughts, ideas, and reflections. 
              Connect with minds that inspire and stories that resonate.
            </p>
            <div className="flex justify-center">
              <Button
                className="group bg-slate-800 hover:bg-slate-700 text-white px-6 md:px-8 py-4 md:py-6 rounded-lg text-base md:text-lg shadow-lg hover:shadow-xl transition-all relative z-10"
                onClick={onActionClick}
              >
                <LightbulbIcon className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                {!isLoggedIn ? "Share Your Thoughts" : "Start Writing"}
              </Button>
            </div>
            <div className="mt-16 relative z-10">
              <RevealImageList />
            </div>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
          {[
            "photo-1488590528505-98d2b5aba04b",
            "photo-1486312338219-ce68d2c6f44d",
            "photo-1605810230434-7631ac76ec81",
            "photo-1649972904349-6e44c42644a7",
            "photo-1487058792275-0ad4aaf24ca7",
            "photo-1649972904349-6e44c42644a7"
          ].map((imageId, i) => (
            <div
              key={i}
              className="relative group overflow-hidden rounded-lg transition-all hover:scale-105 bg-white shadow-md"
            >
              <img
                src={`https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=800&q=80`}
                alt={`Inspiration ${i + 1}`}
                className="w-full h-48 object-cover transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white text-sm font-medium truncate">Share your unique perspective</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ContainerScroll>
    </div>
  );
};
