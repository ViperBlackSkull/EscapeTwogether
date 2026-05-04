import { join } from 'path';
import { mkdir, writeFile, readFile, stat } from 'fs/promises';
import type {
  GeneratedImage,
  GenerationStatus,
  ImageGenerationRequest,
} from './imageTypes.js';
import { BASE_STYLE, ROOM_MODIFIERS } from './imageTypes.js';
import { aiConfig, isImagesEnabled } from '../config/ai.js';

const COMFYUI_URL = aiConfig.comfyuiUrl;
const GENERATED_DIR = join(
  process.cwd(),
  'server',
  'assets',
  'generated',
);
const NEGATIVE_PROMPT =
  'blurry, low quality, distorted, ugly, watermark, text, signature, photorealistic, 3d render, noisy, messy lines, overexposed';

// --- In-memory generation tracking ---

const generationStatus = new Map<string, GenerationStatus>();
const generatedImages = new Map<string, GeneratedImage>();

// --- Rate limiting (same pattern as aiService) ---

const MAX_RPM = aiConfig.rateLimitRpm;
const requestTimestamps: number[] = [];

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  while (requestTimestamps.length > 0 && now - requestTimestamps[0]! > 60_000) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length < MAX_RPM) {
    requestTimestamps.push(Date.now());
    return;
  }

  const oldestInWindow = requestTimestamps[0]!;
  const waitMs = 60_000 - (Date.now() - oldestInWindow) + 50;
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  requestTimestamps.shift();
  requestTimestamps.push(Date.now());
}

// --- ComfyUI API helpers ---

async function comfyuiPost(workflow: object): Promise<{ promptId: string }> {
  const resp = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: `img-gen-${Date.now()}` }),
  });

  if (!resp.ok) {
    throw new Error(`ComfyUI POST /prompt failed: ${resp.status} ${resp.statusText}`);
  }

  const data = (await resp.json()) as { prompt_id: string };
  return { promptId: data.prompt_id };
}

async function comfyuiGetHistory(
  promptId: string,
): Promise<{ status: string; outputFilename?: string }> {
  const resp = await fetch(`${COMFYUI_URL}/history/${promptId}`);

  if (!resp.ok) {
    return { status: 'running' };
  }

  const data = (await resp.json()) as Record<
    string,
    {
      status: { status_str: string };
      outputs: Record<string, { images?: { filename: string }[] }>;
    }
  >;

  const entry = data[promptId];
  if (!entry) return { status: 'running' };

  const statusStr = entry.status?.status_str;
  if (statusStr === 'success') {
    const images = entry.outputs?.['13']?.images;
    const outputFilename = images?.[0]?.filename;
    return { status: 'success', outputFilename };
  }

  if (statusStr === 'error') {
    return { status: 'error' };
  }

  return { status: 'running' };
}

async function comfyuiDownload(
  outputFilename: string,
  localPath: string,
): Promise<void> {
  const url = `${COMFYUI_URL}/view?filename=${encodeURIComponent(outputFilename)}&subfolder=&type=output`;
  const resp = await fetch(url);

  if (!resp.ok) {
    throw new Error(`ComfyUI download failed: ${resp.status}`);
  }

  const buffer = Buffer.from(await resp.arrayBuffer());
  await writeFile(localPath, buffer);
}

// --- Workflow builder (FLUX1-dev pipeline) ---

function buildWorkflow(
  prompt: string,
  filename: string,
  width: number,
  height: number,
  seed: number = Math.floor(Math.random() * 2 ** 32),
): object {
  return {
    '3': {
      class_type: 'KSampler',
      inputs: {
        seed,
        steps: 28,
        cfg: 3.5,
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1,
        model: ['12', 0],
        positive: ['6', 0],
        negative: ['7', 0],
        latent_image: ['5', 0],
      },
    },
    '4': {
      class_type: 'UNETLoader',
      inputs: {
        unet_name: 'FLUX1/flux1-dev-fp8.safetensors',
        weight_dtype: 'default',
      },
    },
    '5': {
      class_type: 'EmptyLatentImage',
      inputs: { width, height, batch_size: 1 },
    },
    '10': {
      class_type: 'DualCLIPLoader',
      inputs: {
        clip_name1: 't5/t5xxl_fp8_e4m3fn.safetensors',
        clip_name2: 'clip_l.safetensors',
        type: 'flux',
      },
    },
    '6': {
      class_type: 'CLIPTextEncode',
      inputs: { text: prompt, clip: ['10', 0] },
    },
    '7': {
      class_type: 'CLIPTextEncode',
      inputs: { text: NEGATIVE_PROMPT, clip: ['10', 0] },
    },
    '8': {
      class_type: 'VAEDecode',
      inputs: { samples: ['3', 0], vae: ['9', 0] },
    },
    '9': {
      class_type: 'VAELoader',
      inputs: { vae_name: 'ae.safetensors' },
    },
    '12': {
      class_type: 'LoraLoaderModelOnly',
      inputs: {
        lora_name: 'game_asst.safetensors',
        strength_model: 1.0,
        model: ['4', 0],
      },
    },
    '13': {
      class_type: 'SaveImage',
      inputs: { filename_prefix: filename, images: ['8', 0] },
    },
  };
}

// --- Poll for completion ---

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_WAIT_MS = 120_000;

async function pollUntilDone(
  promptId: string,
): Promise<string> {
  const start = Date.now();

  while (Date.now() - start < MAX_POLL_WAIT_MS) {
    const result = await comfyuiGetHistory(promptId);

    if (result.status === 'success' && result.outputFilename) {
      return result.outputFilename;
    }

    if (result.status === 'error') {
      throw new Error(`ComfyUI generation failed for prompt ${promptId}`);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`ComfyUI generation timed out after ${MAX_POLL_WAIT_MS / 1000}s`);
}

// --- Ensure output directory exists ---

async function ensureOutputDir(): Promise<string> {
  await mkdir(GENERATED_DIR, { recursive: true });
  return GENERATED_DIR;
}

// --- Check if an image file already exists ---

async function imageExists(filename: string): Promise<string | null> {
  const localPath = join(GENERATED_DIR, `${filename}.png`);
  try {
    const s = await stat(localPath);
    if (s.isFile()) return localPath;
  } catch {
    // file doesn't exist
  }
  return null;
}

// --- Core generation ---

async function generateImage(req: ImageGenerationRequest): Promise<GeneratedImage> {
  const id = `${req.type}-${req.filename}`;

  // Check if already generated
  const existingPath = await imageExists(req.filename);
  if (existingPath) {
    const existing: GeneratedImage = {
      id,
      filename: `${req.filename}.png`,
      prompt: req.prompt,
      type: req.type,
      width: req.width,
      height: req.height,
      createdAt: Date.now(),
      localPath: existingPath,
    };
    generatedImages.set(id, existing);
    return existing;
  }

  const outputDir = await ensureOutputDir();

  try {
    await waitForRateLimit();

    const workflow = buildWorkflow(req.prompt, req.filename, req.width, req.height);
    const { promptId } = await comfyuiPost(workflow);

    generationStatus.set(id, { id, status: 'running' });

    const outputFilename = await pollUntilDone(promptId);
    const localPath = join(outputDir, `${req.filename}.png`);

    await comfyuiDownload(outputFilename, localPath);

    const generated: GeneratedImage = {
      id,
      filename: `${req.filename}.png`,
      prompt: req.prompt,
      type: req.type,
      width: req.width,
      height: req.height,
      createdAt: Date.now(),
      localPath,
    };

    generatedImages.set(id, generated);
    generationStatus.set(id, { id, status: 'completed', outputFilename });

    return generated;
  } catch (err) {
    generationStatus.set(id, {
      id,
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

// --- Public API ---

export async function generateRoomScene(
  prompt: string,
  roomTheme: string,
): Promise<GeneratedImage> {
  const modifier = ROOM_MODIFIERS[roomTheme.toLowerCase()] || '';
  const fullPrompt = `${prompt}, ${modifier}, ${BASE_STYLE}, stylized cartoon style, vibrant saturated colors, bold clean lines, thick outlines, cel-shaded, game background, professional game art`;

  return generateImage({
    prompt: fullPrompt,
    filename: `room-${roomTheme.toLowerCase()}`,
    type: 'background',
    width: 1280,
    height: 720,
  });
}

export async function generatePuzzleIllustration(
  puzzleType: string,
  roomTheme: string,
): Promise<GeneratedImage> {
  const fullPrompt = `game puzzle illustration for ${puzzleType} puzzle in ${roomTheme} themed room, ${BASE_STYLE}, stylized cartoon style, vibrant saturated colors, bold clean lines, thick outlines, cel-shaded, game asset, centered composition, professional game art`;

  return generateImage({
    prompt: fullPrompt,
    filename: `puzzle-${puzzleType}-${roomTheme.toLowerCase()}`,
    type: 'puzzle-illustration',
    width: 512,
    height: 512,
  });
}

export async function generateClueImage(
  description: string,
): Promise<GeneratedImage> {
  const fullPrompt = `${description}, ${BASE_STYLE}, stylized cartoon style, detailed prop illustration, game asset, professional game art`;

  const filename = `clue-${description.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;

  return generateImage({
    prompt: fullPrompt,
    filename,
    type: 'clue',
    width: 512,
    height: 512,
  });
}

export async function batchGenerate(
  requests: ImageGenerationRequest[],
): Promise<GeneratedImage[]> {
  const results: GeneratedImage[] = [];

  for (const req of requests) {
    try {
      const result = await generateImage(req);
      results.push(result);
    } catch (err) {
      console.error(`Failed to generate image "${req.filename}":`, err);
      // Continue with remaining images
    }
  }

  return results;
}

export function getGeneratedImage(id: string): GeneratedImage | undefined {
  return generatedImages.get(id);
}

export function getGenerationStatus(id: string): GenerationStatus | undefined {
  return generationStatus.get(id);
}

export function getGeneratedDir(): string {
  return GENERATED_DIR;
}

export function getComfyuiUrl(): string {
  return COMFYUI_URL;
}

export async function isComfyuiAvailable(): Promise<boolean> {
  if (!isImagesEnabled()) return false;
  try {
    const resp = await fetch(`${COMFYUI_URL}/system_stats`, {
      signal: AbortSignal.timeout(5000),
    });
    return resp.ok;
  } catch {
    return false;
  }
}
