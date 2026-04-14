import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrate";
import { env } from "@/lib/env";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function CharactersPage() {
  runMigrations(env.dbPath);
  const rows = db
    .select()
    .from(schema.characters)
    .orderBy(desc(schema.characters.updatedAt))
    .all();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-muted hover:text-text">
            ← ホーム
          </Link>
          <h1 className="text-xl font-semibold mt-1">キャラクター一覧</h1>
          <p className="text-sm text-muted">
            作成済みのキャラクターはここから呼び出せます。会話は別画面で復元されます。
          </p>
        </div>
        <Link href="/onboarding">
          <Button>新規作成</Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-panel p-6 text-sm text-muted">
          まだキャラクターがいません。
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rows.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-border bg-panel p-4 flex gap-3"
            >
              <div className="w-20 h-20 rounded-lg bg-panelAlt overflow-hidden border border-border flex-shrink-0">
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
                <div className="font-semibold">{c.name}</div>
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
    </div>
  );
}
