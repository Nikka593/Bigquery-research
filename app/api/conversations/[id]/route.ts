import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const conv = db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.id, id))
    .get();
  if (!conv) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const character = db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, conv.characterId))
    .get();
  const messages = db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, id))
    .orderBy(asc(schema.messages.createdAt))
    .all();
  return NextResponse.json({ conversation: conv, character, messages });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  db.delete(schema.conversations)
    .where(eq(schema.conversations.id, id))
    .run();
  return NextResponse.json({ ok: true });
}
