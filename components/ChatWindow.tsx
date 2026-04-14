"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { MessageBubble } from "./MessageBubble";

export interface ChatMessageVM {
  id: string;
  role: "user" | "assistant";
  content: string;
  scenePrompt: string | null;
  imageUrl: string | null;
  imageStatus: "pending" | "ready" | "failed" | "skipped";
  imageSeed: number | null;
  imageSaved: boolean;
}

export interface ChatBootstrap {
  conversation: { id: string; title: string };
  character: { id: string; name: string; portraitUrl: string | null };
  messages: ChatMessageVM[];
}

export function ChatWindow({ bootstrap }: { bootstrap: ChatBootstrap }) {
  const [messages, setMessages] = useState<ChatMessageVM[]>(bootstrap.messages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const updateMessage = useCallback(
    (id: string, patch: Partial<ChatMessageVM>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      );
    },
    [],
  );

  // Polls /api/messages/:id until image_status leaves 'pending', then merges
  // the result into local state.
  const pollSceneUntilDone = useCallback(
    async (messageId: string) => {
      const start = Date.now();
      while (Date.now() - start < 5 * 60_000) {
        await new Promise((r) => setTimeout(r, 1500));
        try {
          const res = await fetch(`/api/messages/${messageId}`);
          if (!res.ok) continue;
          const m = (await res.json()) as ChatMessageVM;
          updateMessage(messageId, {
            scenePrompt: m.scenePrompt,
            imageUrl: m.imageUrl,
            imageStatus: m.imageStatus,
            imageSeed: m.imageSeed,
            imageSaved: m.imageSaved,
          });
          if (m.imageStatus === "ready" || m.imageStatus === "failed") return;
        } catch {
          /* keep polling */
        }
      }
    },
    [updateMessage],
  );

  const triggerScene = useCallback(
    async (messageId: string) => {
      updateMessage(messageId, { imageStatus: "pending" });
      const pollPromise = pollSceneUntilDone(messageId);
      try {
        await fetch("/api/scene", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId }),
        });
      } catch (e) {
        console.error(e);
        updateMessage(messageId, { imageStatus: "failed" });
      }
      await pollPromise;
    },
    [pollSceneUntilDone, updateMessage],
  );

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: bootstrap.conversation.id,
          userMessage: text,
        }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`chat failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let assistantId: string | null = null;
      let userPlaced = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        // Parse SSE events: blocks separated by "\n\n", lines start with
        // "event:" or "data:".
        let sep: number;
        while ((sep = buf.indexOf("\n\n")) >= 0) {
          const block = buf.slice(0, sep);
          buf = buf.slice(sep + 2);
          let eventName = "message";
          let dataLine = "";
          for (const raw of block.split("\n")) {
            if (raw.startsWith("event:")) eventName = raw.slice(6).trim();
            else if (raw.startsWith("data:")) dataLine = raw.slice(5).trim();
          }
          if (!dataLine) continue;
          const data = JSON.parse(dataLine);

          if (eventName === "meta") {
            assistantId = data.assistantMessageId;
            // Optimistically add both bubbles.
            setMessages((prev) => [
              ...prev,
              {
                id: data.userMessageId,
                role: "user",
                content: text,
                scenePrompt: null,
                imageUrl: null,
                imageStatus: "skipped",
                imageSeed: null,
                imageSaved: false,
              },
              {
                id: data.assistantMessageId,
                role: "assistant",
                content: "",
                scenePrompt: null,
                imageUrl: null,
                imageStatus: "skipped",
                imageSeed: null,
                imageSaved: false,
              },
            ]);
            userPlaced = true;
          } else if (eventName === "delta" && assistantId) {
            const delta = data.text as string;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + delta }
                  : m,
              ),
            );
          } else if (eventName === "done" && assistantId) {
            updateMessage(assistantId, { imageStatus: "pending" });
            // Fire-and-forget; UI continues immediately.
            void triggerScene(assistantId);
          } else if (eventName === "error") {
            console.error("chat error:", data.message);
          }
        }
      }
      if (!userPlaced) {
        // Server failed before sending meta; refresh to recover.
        console.warn("no meta event received");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }, [bootstrap.conversation.id, input, sending, triggerScene, updateMessage]);

  const regenerate = useCallback(
    async (messageId: string) => {
      updateMessage(messageId, { imageStatus: "pending" });
      const pollPromise = pollSceneUntilDone(messageId);
      try {
        await fetch(`/api/scene/${messageId}/regenerate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } catch (e) {
        console.error(e);
        updateMessage(messageId, { imageStatus: "failed" });
      }
      await pollPromise;
    },
    [pollSceneUntilDone, updateMessage],
  );

  return (
    <div className="rounded-xl border border-border bg-panel/40 flex flex-col h-[70vh]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-muted mt-10">
            最初の一言をどうぞ。例:「雨の街で偶然会った」
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              characterName={bootstrap.character.name}
              onRegenerate={regenerate}
            />
          ))
        )}
      </div>
      <div className="border-t border-border p-3 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力 (Enterで送信、Shift+Enterで改行)"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send();
            }
          }}
          disabled={sending}
        />
        <Button onClick={send} disabled={sending || !input.trim()}>
          <Send size={16} />
          送信
        </Button>
      </div>
    </div>
  );
}
