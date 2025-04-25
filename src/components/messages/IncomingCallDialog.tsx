
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface IncomingCallDialogProps {
  call: {
    callId: string;
    caller: {
      id: string;
      username: string;
      avatar_url?: string;
    };
    isVideo: boolean;
  } | null;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallDialog = ({ call, onReject }: IncomingCallDialogProps) => {
  const { toast } = useToast();
  
  if (!call) return null;
  
  const handleReject = () => {
    toast({
      title: "Call Feature Removed",
      description: "The call functionality has been removed from this application.",
      variant: "destructive",
    });
    onReject();
  };
  
  return (
    <Dialog open={!!call} onOpenChange={() => handleReject()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Incoming Call</DialogTitle>
          <DialogDescription>
            Call functionality has been removed from this application.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-4 py-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={call.caller.avatar_url} />
            <AvatarFallback>{call.caller.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{call.caller.username}</p>
            <p className="text-sm text-gray-500">
              {call.isVideo ? 'Video Call' : 'Audio Call'}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="destructive" onClick={handleReject}>
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
