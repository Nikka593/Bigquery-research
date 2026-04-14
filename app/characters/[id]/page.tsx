import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrate";
import { env } from "@/lib/env";
import { CharacterEditor } from "@/components/CharacterEditor";

export const dynamic = "force-dynamic";

export default async function EditCharacterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  runMigrations(env.dbPath);
  const { id } = await params;
  const c = db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, id))
    .get();
  if (!c) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link href="/characters" className="text-sm text-muted hover:text-text">
          ← キャラ一覧
        </Link>
        <h1 className="text-xl font-semibold mt-1">{c.name} を編集</h1>
      </div>
      <CharacterEditor
        initial={{
          id: c.id,
          name: c.name,
          persona: c.persona,
          speakingStyle: c.speakingStyle,
          appearanceText: c.appearanceText,
          basePrompt: c.basePrompt,
          negativePrompt: c.negativePrompt,
          portraitPath: c.portraitPath,
        }}
      />
    </div>
  );
}
