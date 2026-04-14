import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const characters = sqliteTable("characters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  persona: text("persona").notNull().default(""),
  speakingStyle: text("speaking_style").notNull().default(""),
  appearanceText: text("appearance_text").notNull().default(""),
  basePrompt: text("base_appearance_prompt").notNull().default(""),
  negativePrompt: text("negative_prompt")
    .notNull()
    .default(
      "lowres, bad anatomy, bad hands, missing fingers, extra digit, jpeg artifacts, watermark, signature, text",
    ),
  portraitPath: text("portrait_path"),
  llmModel: text("llm_model"),
  sdCheckpoint: text("sd_checkpoint"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  characterId: text("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("新しい会話"),
  lastMessageAt: integer("last_message_at")
    .notNull()
    .default(sql`(unixepoch())`),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  scenePrompt: text("scene_prompt"),
  imagePath: text("image_path"),
  imageStatus: text("image_status", {
    enum: ["pending", "ready", "failed", "skipped"],
  })
    .notNull()
    .default("skipped"),
  imageSeed: integer("image_seed"),
  imageSaved: integer("image_saved", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
