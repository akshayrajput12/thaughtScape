import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Advertisement } from "@/types";
import { AdvertisementCard } from "./AdvertisementCard";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl p-0 overflow-hidden">
        <div className="relative">
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 rounded-full bg-background/80 backdrop-blur-sm"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
          
          <AdvertisementCard advertisement={advertisement} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
