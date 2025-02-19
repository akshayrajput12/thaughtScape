
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, Video, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CallRequest } from "@/utils/webrtc";

interface IncomingCallDialogProps {
  call: CallRequest | null;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallDialog = ({
  call,
  onAccept,
  onReject
}: IncomingCallDialogProps) => {
  if (!call) return null;

  return (
    <Dialog open={Boolean(call)} onOpenChange={() => onReject()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Incoming {call.isVideo ? 'Video' : 'Audio'} Call</DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-4 mt-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={call.caller.avatar_url} />
                <AvatarFallback>{call.caller.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{call.caller.username}</p>
                <p className="text-sm text-gray-500">is calling you...</p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-4 mt-6">
          <Button
            onClick={onReject}
            variant="destructive"
            className="w-32"
          >
            <X className="mr-2" />
            Decline
          </Button>
          <Button
            onClick={onAccept}
            variant="default"
            className="w-32"
          >
            {call.isVideo ? <Video className="mr-2" /> : <Phone className="mr-2" />}
            Accept
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
