function num(v: string | undefined, fallback: number): number {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  ollamaModel: process.env.OLLAMA_MODEL ?? "qwen2.5:7b",
  comfyBaseUrl: process.env.COMFYUI_BASE_URL ?? "http://localhost:8188",
  sdCheckpoint: process.env.SD_CHECKPOINT ?? "anything-v5.safetensors",
  sdWidth: num(process.env.SD_WIDTH, 640),
  sdHeight: num(process.env.SD_HEIGHT, 896),
  sdSteps: num(process.env.SD_STEPS, 22),
  sdCfg: num(process.env.SD_CFG, 6.5),
  sdSampler: process.env.SD_SAMPLER ?? "euler",
  sdScheduler: process.env.SD_SCHEDULER ?? "normal",
  imagesDir: process.env.IMAGES_DIR ?? "./data/images",
  dbPath: process.env.DB_PATH ?? "./data/app.db",
};
