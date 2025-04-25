
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";
import { motion } from "framer-motion";

interface CallControlsProps {
  isInCall: boolean;
  isVideo: boolean;
  isMuted: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onStartCall: (isVideo: boolean) => void;
  onEndCall: () => void;
}

export const CallControls = ({
  isInCall,
  onEndCall
}: CallControlsProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3"
    >
      {isInCall ? (
        <Button
          onClick={onEndCall}
          variant="destructive"
          size="icon"
          className="rounded-full"
        >
          <PhoneOff className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          disabled
          variant="outline"
          size="icon"
          className="rounded-full bg-gray-100 hover:bg-gray-100 border-gray-200 cursor-not-allowed"
        >
          <Phone className="h-4 w-4 text-gray-400" />
        </Button>
      )}
    </motion.div>
  );
};
