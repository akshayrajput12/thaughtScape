import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Advertisement } from "@/types";
import { AdvertisementCard } from "./AdvertisementCard";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdvertisementPopupProps {
  advertisement: Advertisement | null;
  onClose: () => void;
}

export function AdvertisementPopup({
  advertisement,
  onClose,
}: AdvertisementPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (advertisement) {
      // Check if this ad has been shown recently (within the last 24 hours)
      const lastShownAds = JSON.parse(localStorage.getItem("lastShownAds") || "{}");
      const lastShownTime = lastShownAds[advertisement.id];
      const now = new Date().getTime();

      // If the ad hasn't been shown in the last 24 hours, show it
      if (!lastShownTime || now - lastShownTime > 24 * 60 * 60 * 1000) {
        setIsOpen(true);

        // Update the last shown time for this ad
        lastShownAds[advertisement.id] = now;
        localStorage.setItem("lastShownAds", JSON.stringify(lastShownAds));
      }
    }
  }, [advertisement]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  if (!advertisement) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl p-0 overflow-hidden relative">
        <div className="relative">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="group absolute top-3 right-3 z-20 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg border-2 border-gray-200 dark:border-gray-600 w-12 h-12 p-0 flex items-center justify-center transition-all hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer animate-pulse-subtle"
                    onClick={handleClose}
                  >
                    <X className="h-6 w-6 text-gray-700 dark:text-gray-300 group-hover:rotate-90 transition-transform duration-200" />
                    <span className="sr-only">Close</span>
                  </Button>
                </DialogClose>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Close advertisement</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <AdvertisementCard advertisement={advertisement} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
