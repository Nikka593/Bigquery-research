import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { runMigrations } from "@/lib/db/migrate";
import { db, schema } from "@/lib/db/client";
import { env } from "@/lib/env";
import { formatRelative } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Ensure schema exists even on first ever run.
  runMigrations(env.dbPath);

  const characters = db
    .select()
    .from(schema.characters)
    .orderBy(desc(schema.characters.updatedAt))
    .all();

  const conversations = db
    .select({
      id: schema.conversations.id,
      title: schema.conversations.title,
      lastMessageAt: schema.conversations.lastMessageAt,
      characterName: schema.characters.name,
      characterId: schema.characters.id,
      portraitPath: schema.characters.portraitPath,
    })
    .from(schema.conversations)
    .innerJoin(
      schema.characters,
      eq(schema.conversations.characterId, schema.characters.id),
    )
    .orderBy(desc(schema.conversations.lastMessageAt))
    .all();

  const isEmpty = characters.length === 0 && conversations.length === 0;

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-panel p-6">
        <h1 className="text-xl font-semibold mb-1">SceneChat</h1>
        <p className="text-sm text-muted">
          キャラクターと会話しながら、シーンが都度画像として生成されます。
          {isEmpty &&
            "まずはキャラクターを1人作成しましょう。1行のシードからAIが補完することもできます。"}
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/onboarding">
            <Button>新しいキャラクターを作る</Button>
          </Link>
          {characters.length > 0 && (
            <Link href="/characters">
              <Button variant="secondary">キャラ一覧</Button>
            </Link>
          )}
        </div>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-muted mb-2 px-1">
          キャラクター ({characters.length})
        </h2>
        {characters.length === 0 ? (
          <p className="text-sm text-muted px-1">
            まだキャラクターがいません。
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {characters.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-border bg-panel p-4 flex gap-3"
              >
                <div className="w-16 h-16 rounded-lg bg-panelAlt overflow-hidden flex-shrink-0 border border-border">
                  {c.portraitPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/images/${c.portraitPath.split("/").pop()}`}
                      alt={c.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted text-2xl">
                      {c.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{c.name}</div>
                  <p className="text-xs text-muted line-clamp-2 mt-1">
                    {c.persona || "（設定なし）"}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Link href={`/chat?characterId=${c.id}`}>
                      <Button size="sm">会話を始める</Button>
                    </Link>
                    <Link href={`/characters/${c.id}`}>
                      <Button size="sm" variant="ghost">
                        編集
                      </Button>
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-muted mb-2 px-1">
          過去の会話 ({conversations.length})
        </h2>
        {conversations.length === 0 ? (
          <p className="text-sm text-muted px-1">
            セッションをクリアしても、ここから過去の会話を呼び出して再開できます。
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-panel overflow-hidden">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/chat/${c.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-panelAlt"
                >
                  <div className="w-10 h-10 rounded-md bg-panelAlt flex-shrink-0 overflow-hidden border border-border">
                    {c.portraitPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/images/${c.portraitPath.split("/").pop()}`}
                        alt={c.characterName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted">
                        {c.characterName.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{c.title}</div>
                    <div className="text-xs text-muted truncate">
                      {c.characterName}
                    </div>
                  </div>
                  <div className="text-xs text-muted">
                    {formatRelative(c.lastMessageAt)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
