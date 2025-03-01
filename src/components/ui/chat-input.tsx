
import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>{
  onEnterSubmit?: () => void;
}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ className, onEnterSubmit, ...props }, ref) => {
    // Handle key down event
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Enter key press without shift
      if (e.key === 'Enter' && !e.shiftKey && onEnterSubmit) {
        e.preventDefault(); // Prevent newline
        onEnterSubmit();
      }
    };

    return (
      <Textarea
        autoComplete="off"
        ref={ref}
        name="message"
        onKeyDown={handleKeyDown}
        className={cn(
          "max-h-12 px-4 py-3 bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-md flex items-center h-16 resize-none",
          className,
        )}
        {...props}
      />
    );
  },
);
ChatInput.displayName = "ChatInput";

export { ChatInput };
