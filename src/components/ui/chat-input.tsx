
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Send, MicOff } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useToast } from "@/hooks/use-toast";

interface ChatInputProps {
  onSendMessage?: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  onEnterSubmit?: () => void; // No parameters
}

export function ChatInput({
  onSendMessage,
  placeholder = "Type a message...",
  disabled = false,
  value,
  onChange,
  className = "",
  onEnterSubmit,
}: ChatInputProps) {
  const [internalMessage, setInternalMessage] = useState("");
  const { toast } = useToast();
  
  // Determine if we're in controlled or uncontrolled mode
  const isControlled = value !== undefined && onChange !== undefined;
  const message = isControlled ? value : internalMessage;
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isControlled) {
      onChange?.(e);
    } else {
      setInternalMessage(e.target.value);
    }
  };
  
  const {
    isListening,
    startListening,
    stopListening,
    error,
    isSupported,
  } = useSpeechRecognition({
    onResult: (result) => {
      if (isControlled) {
        onChange?.({ target: { value: (value || "") + result } } as React.ChangeEvent<HTMLTextAreaElement>);
      } else {
        setInternalMessage((prev) => prev + result);
      }
    },
  });

  const handleSendMessage = () => {
    if (message?.trim()) {
      if (onEnterSubmit) {
        onEnterSubmit();
      } else if (onSendMessage) {
        onSendMessage(message.trim());
        if (!isControlled) {
          setInternalMessage("");
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleSpeechRecognition = () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className={`flex items-end gap-2 bg-background p-4 border-t ${className}`}>
      <div className="relative flex-1">
        <textarea
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : placeholder}
          disabled={disabled}
          className={`w-full min-h-[80px] max-h-[200px] p-3 pr-12 rounded-md border focus:ring-2 focus:ring-primary/20 focus-visible:outline-none resize-none ${
            isListening ? "bg-primary/5 border-primary/20" : ""
          }`}
        />
        {error && (
          <div className="text-sm text-red-500 mt-1">{error}</div>
        )}
      </div>
      
      {isSupported && (
        <Button
          type="button"
          variant={isListening ? "destructive" : "outline"}
          size="icon"
          disabled={disabled}
          onClick={toggleSpeechRecognition}
          title={isListening ? "Stop listening" : "Start voice input"}
          className="shrink-0"
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </Button>
      )}
      
      <Button
        type="button"
        disabled={!message?.trim() || disabled}
        onClick={handleSendMessage}
        className="shrink-0"
      >
        <Send size={20} className="mr-2" />
        Send
      </Button>
    </div>
  );
}
