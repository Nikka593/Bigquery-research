import { NextResponse } from "next/server";
import { autofillCharacter } from "@/lib/character-autofill";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as { seed?: string };
  if (!body.seed || !body.seed.trim()) {
    return NextResponse.json({ error: "seed is required" }, { status: 400 });
  }
  try {
    const filled = await autofillCharacter(body.seed);
    return NextResponse.json(filled);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
