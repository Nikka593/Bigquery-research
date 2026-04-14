import { eq } from "drizzle-orm";
import { db, schema } from "./db/client";
import { runTxt2Img } from "./comfyui";
import { extractScene } from "./scene-extractor";

export interface ScenePipelineResult {
  scenePrompt: string;
  imagePath: string;
  imageUrl: string;
  seed: number;
}

/**
 * Given a message id, extract a scene prompt from its content (using the
 * character's history for continuity) and generate an image with ComfyUI.
 * Updates the message row in-place and returns the new state.
 *
 * If `promptOverride` is provided, scene extraction is skipped and the
 * override is used directly. If `seed` is provided, it is used as-is.
 */
export async function runScenePipeline(
  messageId: string,
  opts: { promptOverride?: string; seed?: number } = {},
): Promise<ScenePipelineResult> {
  const message = db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.id, messageId))
    .get();
  if (!message) throw new Error(`message not found: ${messageId}`);
  if (message.role !== "assistant") {
    throw new Error("scene generation only supported for assistant messages");
  }

  const conversation = db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.id, message.conversationId))
    .get();
  if (!conversation) throw new Error("conversation not found");

  const character = db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, conversation.characterId))
    .get();
  if (!character) throw new Error("character not found");

  // Find prior assistant message's scene prompt for continuity, and the
  // immediately preceding user message for context.
  const history = db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, message.conversationId))
    .all()
    .sort((a, b) => a.createdAt - b.createdAt);

  const idx = history.findIndex((m) => m.id === messageId);
  const previousScene = history
    .slice(0, idx)
    .reverse()
    .find((m) => m.role === "assistant" && m.scenePrompt)?.scenePrompt;
  const userMessage = history
    .slice(0, idx)
    .reverse()
    .find((m) => m.role === "user")?.content;

  // Mark pending so the UI can show a spinner.
  db.update(schema.messages)
    .set({ imageStatus: "pending" })
    .where(eq(schema.messages.id, messageId))
    .run();

  let scenePrompt: string;
  if (opts.promptOverride && opts.promptOverride.trim()) {
    scenePrompt = opts.promptOverride.trim();
  } else {
    const extracted = await extractScene({
      dialogue: message.content,
      previousScene: previousScene ?? null,
      userMessage: userMessage ?? null,
    });
    scenePrompt = extracted.scene_prompt;
  }

  const finalPositive = [character.basePrompt, scenePrompt]
    .filter(Boolean)
    .join(", ");

  try {
    const result = await runTxt2Img({
      positive: finalPositive,
      negative: character.negativePrompt,
      seed: opts.seed,
      checkpoint: character.sdCheckpoint ?? undefined,
    });

    db.update(schema.messages)
      .set({
        scenePrompt,
        imagePath: result.filePath,
        imageStatus: "ready",
        imageSeed: result.seed,
      })
      .where(eq(schema.messages.id, messageId))
      .run();

    return {
      scenePrompt,
      imagePath: result.filePath,
      imageUrl: result.publicUrl,
      seed: result.seed,
    };
  } catch (e) {
    db.update(schema.messages)
      .set({ imageStatus: "failed", scenePrompt })
      .where(eq(schema.messages.id, messageId))
      .run();
    throw e;
  }
}
