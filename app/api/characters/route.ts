import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET() {
  const rows = db
    .select()
    .from(schema.characters)
    .orderBy(desc(schema.characters.updatedAt))
    .all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
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

  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const id = nanoid();
  db.insert(schema.characters)
    .values({
      id,
      name: body.name.trim(),
      persona: body.persona ?? "",
      speakingStyle: body.speakingStyle ?? "",
      appearanceText: body.appearanceText ?? "",
      basePrompt: body.basePrompt ?? "",
      ...(body.negativePrompt ? { negativePrompt: body.negativePrompt } : {}),
      portraitPath: body.portraitPath ?? null,
      llmModel: body.llmModel ?? null,
      sdCheckpoint: body.sdCheckpoint ?? null,
    })
    .run();

  const created = db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, id))
    .get();
  return NextResponse.json(created, { status: 201 });
}
