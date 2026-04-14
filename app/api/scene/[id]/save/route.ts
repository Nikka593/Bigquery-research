import { eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { db, schema } from "@/lib/db/client";

export const runtime = "nodejs";

/**
 * Streams a single scene image as an attachment download (PNG) and marks
 * the message as `image_saved=true` so we know the user kept it.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const message = db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.id, id))
    .get();
  if (!message?.imagePath) {
    return new Response("not found", { status: 404 });
  }
  let bytes: Buffer;
  try {
    bytes = await readFile(message.imagePath);
  } catch {
    return new Response("file missing", { status: 404 });
  }

  db.update(schema.messages)
    .set({ imageSaved: true })
    .where(eq(schema.messages.id, id))
    .run();

  // Build a friendly filename: <conversationId>_<messageId>.png
  const fileName = `scenechat_${basename(message.imagePath)}`;
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
