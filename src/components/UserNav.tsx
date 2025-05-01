
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfile } from "@/contexts/ProfileContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { safeLog, safeErrorLog } from "@/utils/sanitizeData";
import { Progress } from "@/components/ui/progress";
import { useThoughtLimits } from "@/hooks/use-thought-limits";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function UserNav() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { dailyRemaining, monthlyRemaining } = useThoughtLimits(user?.id);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const navigateToProfile = () => {
    if (user?.id) {
      safeLog("Navigating to profile", { userId: user.id });
      navigate(`/profile/${user.id}`);
    }
  };

  const navigateToAdmin = () => {
    navigate("/admin");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url} alt={profile?.username || ""} />
            <AvatarFallback>
              {profile?.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.full_name || profile?.username}</p>
            <p className="text-xs leading-none text-muted-foreground">
              @{profile?.username}
            </p>
          </div>
        </DropdownMenuLabel>
        
        {/* Thought limits indicator */}
        <div className="px-2 py-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Daily Posts</span>
                    <span className="font-medium">{dailyRemaining}/1</span>
                  </div>
                  <Progress value={dailyRemaining * 100} className="h-1" />
                  
                  <div className="flex justify-between text-xs mt-2">
                    <span className="text-muted-foreground">Monthly Posts</span>
                    <span className="font-medium">{monthlyRemaining}/15</span>
                  </div>
                  <Progress value={(monthlyRemaining / 15) * 100} className="h-1" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>You can post {dailyRemaining} thought today and {monthlyRemaining} thoughts this month</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={navigateToProfile}>
          Profile
        </DropdownMenuItem>
        {profile?.is_admin && (
          <DropdownMenuItem onClick={navigateToAdmin}>
            Admin Dashboard
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
