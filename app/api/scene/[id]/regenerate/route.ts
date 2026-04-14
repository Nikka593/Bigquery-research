import { NextResponse } from "next/server";
import { runScenePipeline } from "@/lib/scene-pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    promptOverride?: string;
    seed?: number;
  };
  try {
    const result = await runScenePipeline(id, {
      promptOverride: body.promptOverride,
      seed: body.seed,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "regenerate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
