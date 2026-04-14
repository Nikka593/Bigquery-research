import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrate";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Entry point for "start a new conversation with character X".
 * Used by the home page's character cards.
 *   /chat?characterId=abc  → creates a conversation and redirects to /chat/<id>
 */
export default async function ChatStarter({
  searchParams,
}: {
  searchParams: Promise<{ characterId?: string }>;
}) {
  runMigrations(env.dbPath);
  const { characterId } = await searchParams;
  if (!characterId) redirect("/");

  const character = db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, characterId))
    .get();
  if (!character) redirect("/");

  const conversationId = nanoid();
  db.insert(schema.conversations)
    .values({
      id: conversationId,
      characterId: character.id,
      title: `${character.name}との会話`,
    })
    .run();
  redirect(`/chat/${conversationId}`);
}
