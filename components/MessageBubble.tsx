"use client";

import { cn } from "@/lib/utils";
import { SceneImage } from "./SceneImage";
import type { ChatMessageVM } from "./ChatWindow";

export function MessageBubble({
  message,
  characterName,
  onRegenerate,
}: {
  message: ChatMessageVM;
  characterName: string;
  onRegenerate: (messageId: string) => void;
}) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex gap-2",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed",
          isUser
            ? "bg-accent/15 border border-accent/30 text-text"
            : "bg-panel border border-border text-text",
        )}
      >
        {!isUser && (
          <div className="text-xs text-muted mb-1">{characterName}</div>
        )}
        {message.content || (
          <span className="text-muted italic">考え中...</span>
        )}
        {message.role === "assistant" && (
          <SceneImage
            messageId={message.id}
            imageUrl={message.imageUrl}
            status={message.imageStatus}
            saved={message.imageSaved}
            onRegenerate={() => onRegenerate(message.id)}
            busy={message.imageStatus === "pending"}
          />
        )}
      </div>
    </div>
  );
}
