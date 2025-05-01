
import { useThoughtLimits } from "@/hooks/use-thought-limits";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThoughtLimitsIndicatorProps {
  userId?: string;
  className?: string;
  showAlert?: boolean;
}

export function ThoughtLimitsIndicator({ 
  userId, 
  className,
  showAlert = true
}: ThoughtLimitsIndicatorProps) {
  const { canCreate, dailyRemaining, monthlyRemaining, reason, isLoading } = useThoughtLimits(userId);

  if (isLoading) {
    return <div className={cn("p-3 text-center text-sm text-muted-foreground animate-pulse", className)}>
      Loading limits...
    </div>;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {!canCreate && showAlert && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 mb-2 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>
            {reason === 'daily_limit_reached' 
              ? "Daily post limit reached" 
              : "Monthly post limit reached"}
          </span>
        </div>
      )}
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Daily Posts</span>
                <span className={cn(
                  "font-medium",
                  dailyRemaining === 0 ? "text-red-500 dark:text-red-400" : ""
                )}>
                  {dailyRemaining}/1
                </span>
              </div>
              <Progress 
                value={dailyRemaining * 100} 
                className={cn(
                  "h-1.5 mt-1",
                  dailyRemaining === 0 ? "bg-red-200 dark:bg-red-950" : ""
                )} 
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>You can post {dailyRemaining} more thought today</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Monthly Posts</span>
                <span className={cn(
                  "font-medium",
                  monthlyRemaining === 0 ? "text-red-500 dark:text-red-400" : ""
                )}>
                  {monthlyRemaining}/15
                </span>
              </div>
              <Progress 
                value={(monthlyRemaining / 15) * 100} 
                className={cn(
                  "h-1.5 mt-1",
                  monthlyRemaining === 0 ? "bg-red-200 dark:bg-red-950" : ""
                )}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>You can post {monthlyRemaining} more thoughts this month</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
