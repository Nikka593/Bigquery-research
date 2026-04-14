import { env } from "./env";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OllamaChatChunk {
  message?: { role?: string; content?: string };
  done?: boolean;
}

interface OllamaGenerateChunk {
  response?: string;
  done?: boolean;
}

/**
 * Call /api/chat with stream:true and return an async iterable of text deltas.
 * Throws on network error; caller is responsible for handling abort.
 */
export async function* chatStream(
  messages: ChatMessage[],
  opts: { model?: string; signal?: AbortSignal } = {},
): AsyncGenerator<string, void, void> {
  const res = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model ?? env.ollamaModel,
      messages,
      stream: true,
    }),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`ollama chat failed: ${res.status} ${text}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;
      try {
        const chunk = JSON.parse(line) as OllamaChatChunk;
        if (chunk.message?.content) yield chunk.message.content;
        if (chunk.done) return;
      } catch {
        // ignore malformed line
      }
    }
  }
}

/**
 * Non-streaming /api/generate with optional JSON mode. Returns full text.
 */
export async function generate(
  prompt: string,
  opts: { model?: string; format?: "json"; system?: string } = {},
): Promise<string> {
  const res = await fetch(`${env.ollamaBaseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model ?? env.ollamaModel,
      prompt,
      system: opts.system,
      stream: false,
      format: opts.format,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ollama generate failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as OllamaGenerateChunk;
  return data.response ?? "";
}

export async function generateJson<T>(
  prompt: string,
  opts: { model?: string; system?: string } = {},
): Promise<T> {
  const raw = await generate(prompt, { ...opts, format: "json" });
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    throw new Error(
      `ollama returned non-JSON response despite format:json. raw=${raw.slice(0, 200)}`,
    );
  }
}
