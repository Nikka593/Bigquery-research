import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { nanoid } from "nanoid";
import { env } from "./env";
import workflowTemplate from "./workflows/basic-txt2img.json";

type Workflow = Record<
  string,
  { class_type: string; inputs: Record<string, unknown> }
>;

interface RunOpts {
  positive: string;
  negative?: string;
  seed?: number;
  checkpoint?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
}

interface RunResult {
  /** Absolute path on disk where the image was saved. */
  filePath: string;
  /** Public URL the browser can use (served by /images/[file]). */
  publicUrl: string;
  /** Seed actually used (handy for "regenerate with new seed"). */
  seed: number;
}

function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

function buildPrompt(opts: RunOpts): { workflow: Workflow; seed: number } {
  // Deep clone so we don't mutate the imported template across calls.
  const wf = JSON.parse(JSON.stringify(workflowTemplate)) as Workflow;
  const seed = opts.seed ?? randomSeed();

  wf["3"].inputs.seed = seed;
  wf["3"].inputs.steps = opts.steps ?? env.sdSteps;
  wf["3"].inputs.cfg = opts.cfg ?? env.sdCfg;
  wf["3"].inputs.sampler_name = env.sdSampler;
  wf["3"].inputs.scheduler = env.sdScheduler;

  wf["4"].inputs.ckpt_name = opts.checkpoint ?? env.sdCheckpoint;

  wf["5"].inputs.width = opts.width ?? env.sdWidth;
  wf["5"].inputs.height = opts.height ?? env.sdHeight;

  wf["6"].inputs.text = opts.positive;
  wf["7"].inputs.text = opts.negative ?? "";

  return { workflow: wf, seed };
}

interface QueuedPrompt {
  prompt_id: string;
  number?: number;
}

interface HistoryEntry {
  outputs: Record<
    string,
    {
      images?: Array<{
        filename: string;
        subfolder: string;
        type: "output" | "temp" | "input";
      }>;
    }
  >;
}

async function queuePrompt(workflow: Workflow): Promise<string> {
  const res = await fetch(`${env.comfyBaseUrl}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow, client_id: nanoid() }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`comfyui /prompt failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as QueuedPrompt;
  if (!data.prompt_id) throw new Error("comfyui /prompt: missing prompt_id");
  return data.prompt_id;
}

async function pollHistory(
  promptId: string,
  timeoutMs = 180_000,
  intervalMs = 1_000,
): Promise<HistoryEntry> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${env.comfyBaseUrl}/history/${promptId}`);
    if (res.ok) {
      const data = (await res.json()) as Record<string, HistoryEntry>;
      const entry = data[promptId];
      if (entry?.outputs && Object.keys(entry.outputs).length > 0) {
        return entry;
      }
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`comfyui poll timeout after ${timeoutMs}ms`);
}

async function downloadImage(
  filename: string,
  subfolder: string,
  type: string,
): Promise<Buffer> {
  const url = new URL(`${env.comfyBaseUrl}/view`);
  url.searchParams.set("filename", filename);
  url.searchParams.set("subfolder", subfolder);
  url.searchParams.set("type", type);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`comfyui /view failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function runTxt2Img(opts: RunOpts): Promise<RunResult> {
  const { workflow, seed } = buildPrompt(opts);
  const promptId = await queuePrompt(workflow);
  const entry = await pollHistory(promptId);

  const firstImage = Object.values(entry.outputs)
    .flatMap((o) => o.images ?? [])
    .at(0);
  if (!firstImage) throw new Error("comfyui returned no image");

  const bytes = await downloadImage(
    firstImage.filename,
    firstImage.subfolder,
    firstImage.type,
  );
  mkdirSync(env.imagesDir, { recursive: true });
  const localFile = `${nanoid()}.png`;
  const filePath = join(env.imagesDir, localFile);
  writeFileSync(filePath, bytes);

  return {
    filePath,
    publicUrl: `/images/${localFile}`,
    seed,
  };
}
