import { generateJson } from "./ollama";

export interface AutofilledCharacter {
  name: string;
  persona: string;
  speakingStyle: string;
  appearanceText: string;
  basePrompt: string;
}

const SYSTEM_PROMPT = `You generate a roleplay character card from a single Japanese seed phrase.

Return strict JSON with EXACTLY these keys:
{
  "name": "Japanese name (e.g., リリィ, 朔, etc.)",
  "persona": "Japanese paragraph describing personality, background, and motivations (3-5 sentences).",
  "speaking_style": "Japanese description of how they talk: first-person, sentence endings, register.",
  "appearance_text": "Japanese description of their visual appearance (hair, eyes, clothing, accessories).",
  "base_appearance_prompt": "English Stable Diffusion tags, comma-separated, describing ONLY permanent appearance (hair, eyes, outfit). 8-15 tags. Start with '1girl' or '1boy' as appropriate."
}

No commentary, no markdown, just JSON.`;

interface RawAutofill {
  name?: string;
  persona?: string;
  speaking_style?: string;
  appearance_text?: string;
  base_appearance_prompt?: string;
}

function fallback(seed: string): AutofilledCharacter {
  return {
    name: "新しいキャラクター",
    persona: seed,
    speakingStyle: "",
    appearanceText: "",
    basePrompt: "1girl, anime style, masterpiece, best quality",
  };
}

export async function autofillCharacter(
  seed: string,
): Promise<AutofilledCharacter> {
  const trimmed = seed.trim();
  if (!trimmed) return fallback("");

  try {
    const raw = await generateJson<RawAutofill>(
      `Seed: ${trimmed}\nReturn the JSON now.`,
      { system: SYSTEM_PROMPT },
    );
    return {
      name: (raw.name ?? "").trim() || "新しいキャラクター",
      persona: (raw.persona ?? "").trim() || trimmed,
      speakingStyle: (raw.speaking_style ?? "").trim(),
      appearanceText: (raw.appearance_text ?? "").trim(),
      basePrompt:
        (raw.base_appearance_prompt ?? "").trim() ||
        "1girl, anime style, masterpiece, best quality",
    };
  } catch (e) {
    console.error("[autofill] failed, using fallback:", e);
    return fallback(trimmed);
  }
}
