import { notFound } from "next/navigation";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrate";
import { env } from "@/lib/env";
import { ChatWindow, type ChatBootstrap } from "@/components/ChatWindow";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  runMigrations(env.dbPath);
  const { conversationId } = await params;

  const conversation = db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.id, conversationId))
    .get();
  if (!conversation) notFound();

  const character = db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, conversation.characterId))
    .get();
  if (!character) notFound();

  const messages = db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .orderBy(asc(schema.messages.createdAt))
    .all();

  const bootstrap: ChatBootstrap = {
    conversation,
    character: {
      id: character.id,
      name: character.name,
      portraitUrl: character.portraitPath
        ? `/images/${character.portraitPath.split("/").pop()}`
        : null,
    },
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      scenePrompt: m.scenePrompt,
      imageUrl: m.imagePath
        ? `/images/${m.imagePath.split("/").pop()}`
        : null,
      imageStatus: m.imageStatus,
      imageSeed: m.imageSeed,
      imageSaved: m.imageSaved,
    })),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-muted hover:text-text">
            ← ホーム
          </Link>
          <h1 className="text-lg font-semibold mt-1">{conversation.title}</h1>
          <p className="text-xs text-muted">{character.name}</p>
        </div>
      </div>
      <ChatWindow bootstrap={bootstrap} />
    </div>
  );
}
