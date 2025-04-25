
import { Dispatch, RefObject, SetStateAction, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeftIcon, UserX, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Message, Profile } from "@/types";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ChatAreaProps {
  selectedUser: Profile | null;
  currentUserId: string;
  messages: Message[];
  newMessage: string;
  setNewMessage: Dispatch<SetStateAction<string>>;
  followStatus: { [key: string]: boolean };
  messageCount: number;
  isInCall: boolean;
  isVideo: boolean;
  isMuted: boolean;
  callDuration: number;
  isListening: boolean;
  isMobileView: boolean;
  messagesEndRef: RefObject<HTMLDivElement>;
  handleBackToList: () => void;
  handleStartCall: (withVideo: boolean) => Promise<void>;
  handleEndCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleSpeechRecognition: () => void;
  sendMessage: (e?: FormEvent) => Promise<void>;
  viewUserProfile: (userId: string) => void;
  isUserBlocked: boolean;
  isBlockedBy: boolean;
  onBlockUser: () => Promise<void>;
  onUnblockUser: () => Promise<void>;
}

export const ChatArea = ({
  selectedUser,
  currentUserId,
  isMobileView,
  handleBackToList,
  viewUserProfile,
}: ChatAreaProps) => {
  if (!selectedUser) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 p-5 text-center">
        <div>
          <h3 className="text-xl font-semibold mb-2">Feature Removed</h3>
          <p>The messaging functionality has been removed from this application.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200 p-3 flex items-center">
        {isMobileView && (
          <Button
            onClick={handleBackToList}
            variant="ghost"
            size="icon"
            className="mr-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
        )}
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => viewUserProfile(selectedUser.id)}
        >
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={selectedUser.avatar_url || ''} />
            <AvatarFallback>{selectedUser.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{selectedUser.username}</div>
            <div className="text-xs text-gray-500">
              Feature Removed
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center space-x-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-more-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => viewUserProfile(selectedUser.id)}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserX className="mr-2 h-4 w-4" />
                Feature Removed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto no-scrollbar">
        <div className="bg-yellow-50 p-3 mb-4 rounded-lg border border-yellow-200 flex items-center">
          <Shield className="text-yellow-500 mr-2 h-5 w-5" />
          <span className="text-sm">The messaging feature has been removed from this application.</span>
        </div>
      </div>

      <div className="p-3 border-t border-gray-200">
        <form className="flex items-center space-x-2">
          <Input
            placeholder="Feature removed"
            disabled={true}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={true}
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};
