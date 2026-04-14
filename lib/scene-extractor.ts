import { generateJson } from "./ollama";

export interface ExtractedScene {
  scene_prompt: string;
}

const SYSTEM_PROMPT = `You convert a single line of Japanese narrative dialogue into a Stable Diffusion positive prompt.

Rules:
- Output English, comma-separated tags only (Danbooru / SD style).
- Describe location, time of day, lighting, weather, camera framing, character pose and expression.
- Do NOT describe the character's permanent appearance (hair color, eye color, outfit) — that is added separately.
- Keep it concise (around 12-25 tags). No prose, no quotes, no Japanese.
- Always return JSON: {"scene_prompt": "..."}`;

export async function extractScene(input: {
  dialogue: string;
  previousScene?: string | null;
  userMessage?: string | null;
}): Promise<ExtractedScene> {
  const ctx: string[] = [];
  if (input.previousScene)
    ctx.push(`Previous scene tags (for continuity): ${input.previousScene}`);
  if (input.userMessage)
    ctx.push(`User said: ${input.userMessage}`);
  ctx.push(`Character said: ${input.dialogue}`);
  const prompt = ctx.join("\n");

  const result = await generateJson<Partial<ExtractedScene>>(prompt, {
    system: SYSTEM_PROMPT,
  });
  const scene_prompt = (result.scene_prompt ?? "").trim();
  if (!scene_prompt) {
    return {
      scene_prompt:
        "indoor, soft lighting, medium shot, neutral expression, calm atmosphere",
    };
  }
  return { scene_prompt };
}
