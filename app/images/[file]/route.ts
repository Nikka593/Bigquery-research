import { readFile } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const TYPE_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

/**
 * Serves files from `env.imagesDir`. The `[file]` segment is sanitized via
 * basename() so path traversal (e.g. `../../etc/passwd`) is impossible.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const safeName = basename(file);
  const filePath = join(env.imagesDir, safeName);
  let bytes: Buffer;
  try {
    bytes = await readFile(filePath);
  } catch {
    return new Response("not found", { status: 404 });
  }
  const type = TYPE_BY_EXT[extname(safeName).toLowerCase()] ?? "image/png";
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
