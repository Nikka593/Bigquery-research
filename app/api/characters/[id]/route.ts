import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const row = db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, id))
    .get();
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Partial<{
    name: string;
    persona: string;
    speakingStyle: string;
    appearanceText: string;
    basePrompt: string;
    negativePrompt: string;
    portraitPath: string;
    llmModel: string;
    sdCheckpoint: string;
  }>;

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.persona !== undefined) updates.persona = body.persona;
  if (body.speakingStyle !== undefined)
    updates.speakingStyle = body.speakingStyle;
  if (body.appearanceText !== undefined)
    updates.appearanceText = body.appearanceText;
  if (body.basePrompt !== undefined) updates.basePrompt = body.basePrompt;
  if (body.negativePrompt !== undefined)
    updates.negativePrompt = body.negativePrompt;
  if (body.portraitPath !== undefined)
    updates.portraitPath = body.portraitPath;
  if (body.llmModel !== undefined) updates.llmModel = body.llmModel;
  if (body.sdCheckpoint !== undefined)
    updates.sdCheckpoint = body.sdCheckpoint;
  updates.updatedAt = sql`(unixepoch())`;

  db.update(schema.characters)
    .set(updates)
    .where(eq(schema.characters.id, id))
    .run();

  const row = db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, id))
    .get();
  return NextResponse.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  db.delete(schema.characters).where(eq(schema.characters.id, id)).run();
  return NextResponse.json({ ok: true });
}
