import { stat, readdir } from 'fs/promises';
import { join } from 'path';
import {
  generateRoomScene,
  generatePuzzleIllustration,
  isComfyuiAvailable,
  getGeneratedDir,
} from './imageService.js';
import type { GeneratedImage } from './imageTypes.js';
import { ROOMS } from '../../../shared/types/gameFlow.js';

export interface AssetGenerationResult {
  total: number;
  succeeded: number;
  skipped: number;
  failed: number;
  assets: GeneratedImage[];
  errors: string[];
}

const ROOM_THEMES: Record<string, string> = {
  0: 'invitation',
  1: 'workshop',
  2: 'laboratory',
  3: 'labyrinth',
  4: 'vault',
};

function getAssetDefinitions(): Array<{
  type: 'background' | 'puzzle';
  roomIndex: number;
  theme: string;
  puzzleType?: string;
}> {
  const defs: Array<{
    type: 'background' | 'puzzle';
    roomIndex: number;
    theme: string;
    puzzleType?: string;
  }> = [];

  for (let i = 0; i < ROOMS.length; i++) {
    const room = ROOMS[i]!;
    const theme = ROOM_THEMES[i] || 'workshop';

    defs.push({ type: 'background', roomIndex: i, theme });

    for (const puzzleType of room.puzzles) {
      defs.push({ type: 'puzzle', roomIndex: i, theme, puzzleType });
    }
  }

  return defs;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isFile();
  } catch {
    return false;
  }
}

export async function listExistingAssets(): Promise<string[]> {
  const dir = getGeneratedDir();
  try {
    const files = await readdir(dir);
    return files.filter((f) => f.endsWith('.png'));
  } catch {
    return [];
  }
}

export async function preGenerateAssets(
  onProgress?: (message: string) => void,
): Promise<AssetGenerationResult> {
  const log = onProgress ?? (() => {});
  const result: AssetGenerationResult = {
    total: 0,
    succeeded: 0,
    skipped: 0,
    failed: 0,
    assets: [],
    errors: [],
  };

  const comfyuiAvailable = await isComfyuiAvailable();

  if (!comfyuiAvailable) {
    log('ComfyUI is not available — skipping asset generation');
    return result;
  }

  const definitions = getAssetDefinitions();
  result.total = definitions.length;

  for (const def of definitions) {
    const assetName =
      def.type === 'background'
        ? `Room ${def.roomIndex + 1} background (${def.theme})`
        : `Puzzle "${def.puzzleType}" illustration (${def.theme})`;

    const expectedFilename =
      def.type === 'background'
        ? `room-${def.theme}.png`
        : `puzzle-${def.puzzleType}-${def.theme}.png`;

    const expectedPath = join(getGeneratedDir(), expectedFilename);

    if (await fileExists(expectedPath)) {
      log(`[SKIP] ${assetName} — already exists`);
      result.skipped++;
      continue;
    }

    try {
      log(`[GEN] Generating ${assetName}...`);
      let image: GeneratedImage;

      if (def.type === 'background') {
        const room = ROOMS[def.roomIndex]!;
        image = await generateRoomScene(room.description, def.theme);
      } else {
        image = await generatePuzzleIllustration(def.puzzleType!, def.theme);
      }

      result.assets.push(image);
      result.succeeded++;
      log(`[OK] ${assetName} → ${image.filename}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.failed++;
      result.errors.push(`${assetName}: ${msg}`);
      log(`[FAIL] ${assetName}: ${msg}`);
    }
  }

  return result;
}
