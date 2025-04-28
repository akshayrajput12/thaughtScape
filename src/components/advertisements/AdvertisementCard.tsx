import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Image as ImageIcon } from "lucide-react";
import { Advertisement } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdvertisementCardProps {
  advertisement: Advertisement;
  variant?: "default" | "compact";
  className?: string;
}

export function AdvertisementCard({
  advertisement,
  variant = "default",
  className,
}: AdvertisementCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(advertisement.main_image_index || 0);
  
  // Ensure the current image index is valid
  const safeImageIndex = advertisement.images && advertisement.images.length > 0
    ? Math.min(currentImageIndex, advertisement.images.length - 1)
    : 0;
  
  const currentImage = advertisement.images && advertisement.images.length > 0
    ? advertisement.images[safeImageIndex]
    : null;

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleVisitLink = () => {
    if (advertisement.link_url) {
      window.open(advertisement.link_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "group relative bg-card rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-primary/10",
        variant === "compact" ? "max-w-md" : "max-w-2xl",
        className
      )}
    >
      {/* Sponsored badge */}
      <div className="absolute top-2 right-2 z-10">
        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">
          Sponsored
        </span>
      </div>

      <div className="p-4 sm:p-5">
        {/* Title and description */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">{advertisement.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{advertisement.description}</p>
        </div>

        {/* Main image */}
        {currentImage && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-4">
            <img
              src={currentImage}
              alt={advertisement.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        {/* Thumbnail images */}
        {advertisement.images && advertisement.images.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {advertisement.images.map((image, index) => (
              <button
                key={index}
                onClick={() => handleImageClick(index)}
                className={cn(
                  "relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border-2",
                  index === currentImageIndex
                    ? "border-primary"
                    : "border-transparent hover:border-primary/50"
                )}
              >
                <img
                  src={image}
                  alt={`${advertisement.title} thumbnail ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Link button */}
        {advertisement.link_url && (
          <Button
            onClick={handleVisitLink}
            className="w-full flex items-center justify-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Visit Link
          </Button>
        )}
      </div>
    </motion.div>
  );
}
