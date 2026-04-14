import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const row = db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.id, id))
    .get();
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  // Don't leak the absolute disk path to the client.
  const { imagePath, ...safe } = row;
  return NextResponse.json({
    ...safe,
    imageUrl: imagePath
      ? `/images/${imagePath.split("/").pop()}`
      : null,
  });
}
