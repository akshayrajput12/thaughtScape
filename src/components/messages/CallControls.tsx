
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Phone, Video, MicOff, Mic, VideoOff, PhoneOff } from "lucide-react";
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
  isVideo,
  isMuted,
  onToggleAudio,
  onToggleVideo,
  onStartCall,
  onEndCall
}: CallControlsProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3"
    >
      {!isInCall ? (
        <>
          <Button
            onClick={() => onStartCall(false)}
            variant="outline"
            size="icon"
            className="rounded-full bg-green-50 hover:bg-green-100 border-green-200"
          >
            <Phone className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            onClick={() => onStartCall(true)}
            variant="outline"
            size="icon"
            className="rounded-full bg-blue-50 hover:bg-blue-100 border-blue-200"
          >
            <Video className="h-4 w-4 text-blue-600" />
          </Button>
        </>
      ) : (
        <>
          <Button
            onClick={onToggleAudio}
            variant="outline"
            size="icon"
            className={`rounded-full ${
              isMuted 
                ? "bg-red-50 hover:bg-red-100 border-red-200" 
                : "bg-green-50 hover:bg-green-100 border-green-200"
            }`}
          >
            {isMuted ? (
              <MicOff className="h-4 w-4 text-red-600" />
            ) : (
              <Mic className="h-4 w-4 text-green-600" />
            )}
          </Button>
          {isVideo && (
            <Button
              onClick={onToggleVideo}
              variant="outline"
              size="icon"
              className="rounded-full bg-blue-50 hover:bg-blue-100 border-blue-200"
            >
              {isVideo ? (
                <Video className="h-4 w-4 text-blue-600" />
              ) : (
                <VideoOff className="h-4 w-4 text-blue-600" />
              )}
            </Button>
          )}
          <Button
            onClick={onEndCall}
            variant="destructive"
            size="icon"
            className="rounded-full"
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </>
      )}
    </motion.div>
  );
};
