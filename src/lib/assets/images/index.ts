/**
 * Puzzle Visual Assets - AI Generated Images
 *
 * These assets are generated using ComfyUI with the DreamShaper_8_pruned checkpoint.
 * Images are 512x512 PNG format with Victorian mysterious aesthetic.
 *
 * Location: /static/assets/images/puzzles/
 *
 * Usage:
 * - Import the URL paths and use them in img src or CSS background-image
 * - Images can be scaled for higher resolution displays
 */

// Base path for puzzle images
const PUZZLE_IMAGES_BASE = '/assets/images/puzzles';

/**
 * Puzzle image asset URLs
 */
export const puzzleImages = {
  // Cipher & Decoding Puzzles
  cipherWheel: `${PUZZLE_IMAGES_BASE}/cipher-wheel.png`,
  codebook: `${PUZZLE_IMAGES_BASE}/codebook.png`,
  mysteriousGlyphs: `${PUZZLE_IMAGES_BASE}/mysterious-glyphs.png`,

  // Navigation & Discovery
  treasureMap: `${PUZZLE_IMAGES_BASE}/treasure-map.png`,
  compass: `${PUZZLE_IMAGES_BASE}/compass.png`,

  // Lock Mechanisms
  vintageLock: `${PUZZLE_IMAGES_BASE}/vintage-lock.png`,
  antiqueKeys: `${PUZZLE_IMAGES_BASE}/antique-keys.png`,
  secretCompartment: `${PUZZLE_IMAGES_BASE}/secret-compartment.png`,

  // Clue Items
  clueLetter: `${PUZZLE_IMAGES_BASE}/clue-letter.png`,
  clueNote: `${PUZZLE_IMAGES_BASE}/clue-note.png`,
  cluePhotograph: `${PUZZLE_IMAGES_BASE}/clue-photograph.png`,

  // Investigation Tools
  magnifyingGlass: `${PUZZLE_IMAGES_BASE}/magnifying-glass.png`,

  // Time & Pressure
  hourglass: `${PUZZLE_IMAGES_BASE}/hourglass.png`,

  // Decorative Elements
  victorianOrnament: `${PUZZLE_IMAGES_BASE}/victorian-ornament.png`,
  puzzleTexture: `${PUZZLE_IMAGES_BASE}/puzzle-texture.png`,
  candleHolder: `${PUZZLE_IMAGES_BASE}/candle-holder.png`,
} as const;

/**
 * Asset metadata for puzzle images
 */
export const puzzleImageMeta = {
  cipherWheel: {
    name: 'Cipher Wheel',
    description: 'Victorian-era cipher wheel / decoder disk with mysterious symbols',
    useCase: 'Cipher puzzles, rotation-based decoding',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  codebook: {
    name: 'Codebook',
    description: 'Antique leather-bound cipher manual with mysterious symbols',
    useCase: 'Reference for decoding puzzles, hidden messages',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  mysteriousGlyphs: {
    name: 'Mysterious Glyphs',
    description: 'Ancient symbols and glyphs carved in stone',
    useCase: 'Symbol matching puzzles, rune decoding',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  treasureMap: {
    name: 'Treasure Map',
    description: 'Old weathered treasure map on parchment',
    useCase: 'Navigation puzzles, hidden location discovery',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  compass: {
    name: 'Compass',
    description: 'Antique Victorian brass compass with ornate engravings',
    useCase: 'Direction-based puzzles, navigation hints',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  vintageLock: {
    name: 'Vintage Lock',
    description: 'Antique Victorian padlock mechanism with intricate keyhole',
    useCase: 'Lock-picking puzzles, key-based challenges',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  antiqueKeys: {
    name: 'Antique Keys',
    description: 'Collection of antique Victorian keys with ornate handles',
    useCase: 'Key matching puzzles, lock solutions',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  secretCompartment: {
    name: 'Secret Compartment',
    description: 'Victorian secret compartment in wooden furniture',
    useCase: 'Hidden object puzzles, discovery mechanics',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  clueLetter: {
    name: 'Clue Letter',
    description: 'Antique Victorian letter with mysterious clue and wax seal',
    useCase: 'Text-based puzzles, story progression',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  clueNote: {
    name: 'Clue Note',
    description: 'Torn old note with cryptic message',
    useCase: 'Fragment puzzles, hidden messages',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  cluePhotograph: {
    name: 'Clue Photograph',
    description: 'Antique Victorian sepia photograph in daguerreotype style',
    useCase: 'Visual clues, story elements, portrait puzzles',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  magnifyingGlass: {
    name: 'Magnifying Glass',
    description: 'Antique Victorian magnifying glass with ornate brass handle',
    useCase: 'Inspection mechanics, detail discovery',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  hourglass: {
    name: 'Hourglass',
    description: 'Antique Victorian hourglass sand timer with flowing sand',
    useCase: 'Timed puzzles, countdown mechanics',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  victorianOrnament: {
    name: 'Victorian Ornament',
    description: 'Victorian-era decorative ornament frame with baroque scrollwork',
    useCase: 'UI borders, puzzle frames, decorative overlays',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  puzzleTexture: {
    name: 'Puzzle Texture',
    description: 'Victorian puzzle piece texture pattern with mysterious symbols',
    useCase: 'Background textures, puzzle piece overlays',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  candleHolder: {
    name: 'Candle Holder',
    description: 'Antique Victorian candelabra brass candle holder',
    useCase: 'Atmospheric lighting, mood setting, decorative elements',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
} as const;

/**
 * Type for puzzle image keys
 */
export type PuzzleImageKey = keyof typeof puzzleImages;

/**
 * Get puzzle image URL by key
 */
export function getPuzzleImage(key: PuzzleImageKey): string {
  return puzzleImages[key];
}

/**
 * Get puzzle image metadata by key
 */
export function getPuzzleImageMeta(key: PuzzleImageKey) {
  return puzzleImageMeta[key];
}

/**
 * Room-specific asset mappings
 */
export const roomAssetMapping = {
  room1: {
    attic: {
      // Torn Photographs puzzle
      photographPiece: puzzleImages.cluePhotograph,
      // Love Letter Cipher puzzle
      loveLetter: puzzleImages.clueLetter,
      candle: puzzleImages.candleHolder,
      // Secret Message puzzle
      secretNote: puzzleImages.clueNote,
      magnifyingGlass: puzzleImages.magnifyingGlass,
      // Trunk Lock puzzle
      lock: puzzleImages.vintageLock,
      keys: puzzleImages.antiqueKeys,
    }
  },
  room2: {
    clockTower: {
      // Clock-themed puzzles
      hourglass: puzzleImages.hourglass,
      compass: puzzleImages.compass,
      codebook: puzzleImages.codebook,
    }
  },
  room3: {
    gardenConservatory: {
      // Garden-themed puzzles
      treasureMap: puzzleImages.treasureMap,
      cipherWheel: puzzleImages.cipherWheel,
      mysteriousGlyphs: puzzleImages.mysteriousGlyphs,
    }
  }
} as const;

/**
 * UI asset mappings for common elements
 */
export const uiAssetMapping = {
  frames: {
    ornate: puzzleImages.victorianOrnament,
    textured: puzzleImages.puzzleTexture,
  },
  tools: {
    magnifyingGlass: puzzleImages.magnifyingGlass,
    compass: puzzleImages.compass,
  },
  decorative: {
    candleHolder: puzzleImages.candleHolder,
    hourglass: puzzleImages.hourglass,
  }
} as const;

export default puzzleImages;
