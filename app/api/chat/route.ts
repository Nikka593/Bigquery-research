import { NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "@/lib/db/client";
import { chatStream, generate, type ChatMessage } from "@/lib/ollama";

export const runtime = "nodejs";
export const maxDuration = 300;

interface ChatRequestBody {
  conversationId: string;
  userMessage: string;
}

function buildSystemPrompt(c: typeof schema.characters.$inferSelect): string {
  return [
    `あなたは「${c.name}」という名前のキャラクターとして応答してください。`,
    c.persona && `【人物設定】\n${c.persona}`,
    c.speakingStyle && `【話し方】\n${c.speakingStyle}`,
    c.appearanceText && `【見た目】\n${c.appearanceText}`,
    "",
    "ルール:",
    "- 役を絶対に降りないこと（メタ発言禁止）",
    "- 返答は1〜3段落程度。台詞中心で、必要に応じて情景や仕草を地の文で混ぜる。",
    "- 日本語で応答。",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Streams the assistant's reply via SSE, persists both messages to SQLite,
 * and emits a final `done` event with the new assistant message id so the
 * frontend can kick off scene image generation.
 */
export async function POST(req: Request) {
  const body = (await req.json()) as ChatRequestBody;
  if (!body.conversationId || !body.userMessage?.trim()) {
    return NextResponse.json(
      { error: "conversationId and userMessage are required" },
      { status: 400 },
    );
  }

  const conversation = db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.id, body.conversationId))
    .get();
  if (!conversation) {
    return NextResponse.json(
      { error: "conversation not found" },
      { status: 404 },
    );
  }
  const character = db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, conversation.characterId))
    .get();
  if (!character) {
    return NextResponse.json(
      { error: "character not found" },
      { status: 404 },
    );
  }

  const history = db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, body.conversationId))
    .orderBy(asc(schema.messages.createdAt))
    .all();

  // Persist the user message immediately so it survives any error mid-stream.
  const userId = nanoid();
  db.insert(schema.messages)
    .values({
      id: userId,
      conversationId: body.conversationId,
      role: "user",
      content: body.userMessage.trim(),
      imageStatus: "skipped",
    })
    .run();

  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(character) },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: body.userMessage.trim() },
  ];

  const assistantId = nanoid();
  const encoder = new TextEncoder();
  const isFirstUserMessage = history.length === 0;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Tell the frontend the IDs upfront so it can render bubbles before
      // any tokens arrive.
      controller.enqueue(
        encoder.encode(
          `event: meta\ndata: ${JSON.stringify({
            userMessageId: userId,
            assistantMessageId: assistantId,
          })}\n\n`,
        ),
      );

      let full = "";
      try {
        for await (const delta of chatStream(messages, {
          model: character.llmModel ?? undefined,
        })) {
          full += delta;
          controller.enqueue(
            encoder.encode(
              `event: delta\ndata: ${JSON.stringify({ text: delta })}\n\n`,
            ),
          );
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "stream error";
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ message })}\n\n`,
          ),
        );
        controller.close();
        return;
      }

      // Persist assistant message.
      db.insert(schema.messages)
        .values({
          id: assistantId,
          conversationId: body.conversationId,
          role: "assistant",
          content: full,
          imageStatus: "pending",
        })
        .run();

      db.update(schema.conversations)
        .set({ lastMessageAt: sql`(unixepoch())` })
        .where(eq(schema.conversations.id, body.conversationId))
        .run();

      // Auto-generate a conversation title from the first user message.
      if (isFirstUserMessage) {
        try {
          const title = await generate(
            `次の会話の冒頭から、12文字以内の日本語タイトルを1つだけ返してください。記号や引用符は不要。\n\nユーザー: ${body.userMessage.trim()}\nキャラ: ${full.slice(0, 200)}`,
          );
          const cleaned = title.split("\n")[0].trim().slice(0, 40);
          if (cleaned) {
            db.update(schema.conversations)
              .set({ title: cleaned })
              .where(eq(schema.conversations.id, body.conversationId))
              .run();
          }
        } catch {
          /* noop */
        }
      }

      controller.enqueue(
        encoder.encode(
          `event: done\ndata: ${JSON.stringify({ assistantMessageId: assistantId })}\n\n`,
        ),
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
