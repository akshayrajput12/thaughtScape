
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
    <div className="flex flex-col overflow-hidden -mt-4 sm:-mt-8 pt-20 sm:pt-32">
      <ContainerScroll
        titleComponent={
          <>
            <div className="space-y-4 sm:space-y-6 md:space-y-8 mt-4 sm:mt-8 md:mt-12">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold relative mt-[100px] sm:mt-[150px] z-0 text-center">
                Welcome to
              </h1>
              <div className="h-16 sm:h-24 md:h-32 flex items-center justify-center">
                <GooeyText
                  texts={["CampusCash", "Learning", "Earning", "Connecting"]}
                  morphTime={1.5}
                  cooldownTime={1}
                  className="font-serif w-full"
                  textClassName="bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-slate-600 to-slate-900 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold"
                />
              </div>
            </div>
            <p className="text-base sm:text-lg md:text-xl mt-6 sm:mt-8 text-slate-600 dark:text-slate-300 mb-6 sm:mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed relative z-10 text-center px-4">
              Learn, Earn, and Connect on Campus. Your one-stop platform for campus opportunities,
              knowledge sharing, and building valuable connections.
            </p>
            <div className="flex justify-center">
              <Button
                className="group bg-slate-800 hover:bg-slate-700 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 rounded-lg text-sm sm:text-base md:text-lg shadow-lg hover:shadow-xl transition-all relative z-10"
                onClick={onActionClick}
              >
                <LightbulbIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:rotate-12 transition-transform" />
                {!isLoggedIn ? "Share Your Thoughts" : "Start Writing"}
              </Button>
            </div>
            <div className="mt-10 sm:mt-16 relative z-10 px-2 sm:px-0">
              <RevealImageList />
            </div>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 p-2 sm:p-4">
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
                loading="lazy"
                className="w-full h-36 sm:h-40 md:h-48 object-cover transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white text-xs sm:text-sm font-medium truncate">Share your unique perspective</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ContainerScroll>
    </div>
  );
};
