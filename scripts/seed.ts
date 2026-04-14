import { nanoid } from "nanoid";
import { runMigrations } from "../lib/db/migrate";
import { db, schema } from "../lib/db/client";

const dbPath = process.env.DB_PATH ?? "./data/app.db";
runMigrations(dbPath);

const sample = {
  id: nanoid(),
  name: "リリィ",
  persona:
    "16歳の図書委員。物静かだが芯が強く、相手の言葉をよく聞いてから丁寧に応える。本と紅茶と雨の音が好き。",
  speakingStyle: "落ち着いた敬語混じり。一人称は『わたし』。語尾はやわらかい。",
  appearanceText:
    "銀色のロングヘア、青い瞳、紺色のセーラー服、白いリボン。手には文庫本。",
  basePrompt:
    "1girl, silver long hair, blue eyes, navy sailor uniform, white ribbon, anime style, soft lighting, masterpiece, best quality",
};

const existing = db
  .select({ id: schema.characters.id })
  .from(schema.characters)
  .all();

if (existing.length === 0) {
  db.insert(schema.characters)
    .values({
      id: sample.id,
      name: sample.name,
      persona: sample.persona,
      speakingStyle: sample.speakingStyle,
      appearanceText: sample.appearanceText,
      basePrompt: sample.basePrompt,
    })
    .run();
  console.log(`[seed] inserted sample character: ${sample.name} (${sample.id})`);
} else {
  console.log(`[seed] characters already exist (${existing.length}); skipping`);
}
