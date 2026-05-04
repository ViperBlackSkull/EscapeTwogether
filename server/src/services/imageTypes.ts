export interface GeneratedImage {
  id: string;
  filename: string;
  prompt: string;
  type: 'background' | 'puzzle-illustration' | 'clue';
  width: number;
  height: number;
  createdAt: number;
  localPath: string;
}

export interface GenerationStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  outputFilename?: string;
  error?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  filename: string;
  type: 'background' | 'puzzle-illustration' | 'clue';
  width: number;
  height: number;
}

export const BASE_STYLE =
  'atmospheric escape room, moody lighting, detailed illustration, cinematic composition, rich colors, mysterious ambiance';

export const ROOM_MODIFIERS: Record<string, string> = {
  workshop:
    'warm workshop interior with tools hanging on walls, wooden workbench covered in blueprints, oil lamps casting long shadows, gears and mechanical parts scattered around',
  laboratory:
    'high-tech laboratory with bubbling beakers and test tubes, glowing screens displaying complex formulas, lab equipment with neon indicators, chemical vapors in the air',
  vault:
    'massive steel vault door with intricate locking mechanism, security panels with blinking lights, treasure gleaming under spotlights, reinforced metal walls',
};
