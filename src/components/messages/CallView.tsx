
import { useToast } from "@/hooks/use-toast";
import { useEffect } from 'react';

interface CallViewProps {
  isInCall: boolean;
  isVideo: boolean;
  isMuted: boolean;
  selectedUserId: string;
  currentUserId: string;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onCallEnd: () => void;
}

export const CallView = ({
  onCallEnd
}: CallViewProps) => {
  const { toast } = useToast();
  
  useEffect(() => {
    toast({
      title: "Call Feature Removed",
      description: "The call functionality has been removed from this application.",
      variant: "destructive",
    });
    onCallEnd();
  }, [toast, onCallEnd]);

  return (
    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
      <p className="text-white">Call functionality has been removed from this application.</p>
    </div>
  );
};
