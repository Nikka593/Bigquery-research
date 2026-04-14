import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { runTxt2Img } from "@/lib/comfyui";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/characters/portrait
 * Body: { basePrompt: string, negativePrompt?: string, sdCheckpoint?: string,
 *         characterId?: string }
 *
 * Generates a portrait image. If characterId is supplied, the portrait_path
 * column is updated so it persists across sessions.
 */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    basePrompt?: string;
    negativePrompt?: string;
    sdCheckpoint?: string;
    characterId?: string;
  };
  if (!body.basePrompt || !body.basePrompt.trim()) {
    return NextResponse.json(
      { error: "basePrompt is required" },
      { status: 400 },
    );
  }

  try {
    const result = await runTxt2Img({
      positive: `portrait, upper body, looking at viewer, ${body.basePrompt}`,
      negative: body.negativePrompt,
      checkpoint: body.sdCheckpoint,
    });

    if (body.characterId) {
      db.update(schema.characters)
        .set({ portraitPath: result.filePath })
        .where(eq(schema.characters.id, body.characterId))
        .run();
    }

    return NextResponse.json({
      imageUrl: result.publicUrl,
      imagePath: result.filePath,
      seed: result.seed,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
