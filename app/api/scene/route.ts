import { NextResponse } from "next/server";
import { runScenePipeline } from "@/lib/scene-pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const body = (await req.json()) as { messageId?: string };
  if (!body.messageId) {
    return NextResponse.json(
      { error: "messageId is required" },
      { status: 400 },
    );
  }
  try {
    const result = await runScenePipeline(body.messageId);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "scene failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
