
import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAutoScroll } from "@/components/hooks/use-auto-scroll";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: string | Date;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  isMine: boolean;
  isRead?: boolean;
}

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  className?: string;
  emptyState?: React.ReactNode;
}

export function ChatMessageList({
  messages,
  isLoading = false,
  className = "",
  emptyState,
}: ChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useAutoScroll(containerRef, messages);

  // Group messages by date
  const groupedMessages: Record<string, ChatMessage[]> = {};
  messages.forEach((message) => {
    const date = new Date(message.timestamp);
    const dateStr = format(date, "MMMM d, yyyy");
    if (!groupedMessages[dateStr]) {
      groupedMessages[dateStr] = [];
    }
    groupedMessages[dateStr].push(message);
  });

  return (
    <div
      ref={containerRef}
      className={`flex flex-col space-y-4 overflow-y-auto p-4 h-full ${className}`}
    >
      {isLoading ? (
        <div className="space-y-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 ${
                  i % 2 === 0 ? "justify-start" : "justify-end"
                }`}
              >
                {i % 2 === 0 && (
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                )}
                <div
                  className={`flex flex-col space-y-1 ${
                    i % 2 === 0 ? "items-start" : "items-end"
                  }`}
                >
                  <Skeleton className="h-4 w-20" />
                  <Skeleton
                    className={`h-16 ${i % 2 === 0 ? "w-64" : "w-48"}`}
                  />
                </div>
                {i % 2 !== 0 && (
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                )}
              </div>
            ))}
        </div>
      ) : messages.length === 0 ? (
        emptyState || (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-center">
              No messages yet. Start a conversation!
            </p>
          </div>
        )
      ) : (
        <>
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="space-y-4">
              <div className="relative flex items-center py-2">
                <div className="grow border-t border-gray-200"></div>
                <span className="mx-2 flex-shrink text-xs text-gray-500">
                  {date}
                </span>
                <div className="grow border-t border-gray-200"></div>
              </div>

              {dateMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-2 ${
                    message.isMine ? "justify-end" : "justify-start"
                  }`}
                >
                  {!message.isMine && (
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={message.sender.avatar} />
                      <AvatarFallback>
                        {message.sender.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`flex flex-col space-y-1 ${
                      message.isMine ? "items-end" : "items-start"
                    }`}
                  >
                    <span className="text-xs text-muted-foreground">
                      {message.isMine ? "You" : message.sender.name},{" "}
                      {format(new Date(message.timestamp), "h:mm a")}
                    </span>
                    <div
                      className={`py-2 px-4 rounded-lg max-w-[80%] break-words ${
                        message.isMine
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.content}
                    </div>
                    {message.isMine && (
                      <span className="text-xs text-muted-foreground">
                        {message.isRead ? "Read" : "Sent"}
                      </span>
                    )}
                  </div>
                  {message.isMine && (
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={message.sender.avatar} />
                      <AvatarFallback>
                        {message.sender.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
