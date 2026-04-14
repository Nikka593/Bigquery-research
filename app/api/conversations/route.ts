import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET() {
  const rows = db
    .select({
      id: schema.conversations.id,
      title: schema.conversations.title,
      lastMessageAt: schema.conversations.lastMessageAt,
      createdAt: schema.conversations.createdAt,
      characterId: schema.conversations.characterId,
      characterName: schema.characters.name,
      portraitPath: schema.characters.portraitPath,
    })
    .from(schema.conversations)
    .innerJoin(
      schema.characters,
      eq(schema.conversations.characterId, schema.characters.id),
    )
    .orderBy(desc(schema.conversations.lastMessageAt))
    .all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    characterId?: string;
    title?: string;
  };
  if (!body.characterId) {
    return NextResponse.json(
      { error: "characterId is required" },
      { status: 400 },
    );
  }
  const character = db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, body.characterId))
    .get();
  if (!character) {
    return NextResponse.json(
      { error: "character not found" },
      { status: 404 },
    );
  }
  const id = nanoid();
  db.insert(schema.conversations)
    .values({
      id,
      characterId: body.characterId,
      title: body.title?.trim() || `${character.name}との会話`,
    })
    .run();
  const created = db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.id, id))
    .get();
  return NextResponse.json(created, { status: 201 });
}
