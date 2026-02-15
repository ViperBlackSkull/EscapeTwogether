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

// Base paths
const PUZZLE_IMAGES_BASE = '/assets/images/puzzles';
const ROOM_BACKGROUNDS_BASE = '/assets/images/room-backgrounds';
const UI_BASE = '/assets/images/ui';
const PARTICLES_BASE = '/assets/images/particles';

/**
 * Puzzle image asset URLs
 */
export const puzzleImages = {
  // Cipher & Decoding Puzzles
  cipherWheel: `${PUZZLE_IMAGES_BASE}/cipher-wheel.png`,
  codebook: `${PUZZLE_IMAGES_BASE}/codebook.png`,
  mysteriousGlyphs: `${PUZZLE_IMAGES_BASE}/mysterious-glyphs.png`,
  cryptex: `${PUZZLE_IMAGES_BASE}/cryptex.png`,

  // Navigation & Discovery
  treasureMap: `${PUZZLE_IMAGES_BASE}/treasure-map.png`,
  compass: `${PUZZLE_IMAGES_BASE}/compass.png`,

  // Lock Mechanisms
  vintageLock: `${PUZZLE_IMAGES_BASE}/vintage-lock.png`,
  antiqueKeys: `${PUZZLE_IMAGES_BASE}/antique-keys.png`,
  secretCompartment: `${PUZZLE_IMAGES_BASE}/secret-compartment.png`,
  treasureChest: `${PUZZLE_IMAGES_BASE}/treasure-chest.png`,

  // Clue Items
  clueLetter: `${PUZZLE_IMAGES_BASE}/clue-letter.png`,
  clueNote: `${PUZZLE_IMAGES_BASE}/clue-note.png`,
  cluePhotograph: `${PUZZLE_IMAGES_BASE}/clue-photograph.png`,
  mysteriousPainting: `${PUZZLE_IMAGES_BASE}/mysterious-painting.png`,

  // Investigation Tools
  magnifyingGlass: `${PUZZLE_IMAGES_BASE}/magnifying-glass.png`,
  mirrorReflection: `${PUZZLE_IMAGES_BASE}/mirror-reflection.png`,

  // Time & Pressure
  hourglass: `${PUZZLE_IMAGES_BASE}/hourglass.png`,
  pendulum: `${PUZZLE_IMAGES_BASE}/pendulum.png`,

  // Clock & Mechanics
  clockHands: `${PUZZLE_IMAGES_BASE}/clock-hands.png`,
  gearsCollection: `${PUZZLE_IMAGES_BASE}/gears-collection.png`,
  telegraphKey: `${PUZZLE_IMAGES_BASE}/telegraph-key.png`,
  musicBox: `${PUZZLE_IMAGES_BASE}/music-box.png`,
  bellCollection: `${PUZZLE_IMAGES_BASE}/bell-collection.png`,

  // Botanical
  botanicalIllustration: `${PUZZLE_IMAGES_BASE}/botanical-illustration.png`,
  botanicalHybrid: `${PUZZLE_IMAGES_BASE}/botanical-hybrid.png`,
  seedPackets: `${PUZZLE_IMAGES_BASE}/seed-packets.png`,
  glassVials: `${PUZZLE_IMAGES_BASE}/glass-vials.png`,

  // Decorative Elements
  victorianOrnament: `${PUZZLE_IMAGES_BASE}/victorian-ornament.png`,
  puzzleTexture: `${PUZZLE_IMAGES_BASE}/puzzle-texture.png`,
  candleHolder: `${PUZZLE_IMAGES_BASE}/candle-holder.png`,
} as const;

/**
 * Room background URLs
 */
export const roomBackgrounds = {
  room1Attic: `${ROOM_BACKGROUNDS_BASE}/room1-attic.png`,
  room2ClockTower: `${ROOM_BACKGROUNDS_BASE}/room2-clock-tower.png`,
  room3GardenConservatory: `${ROOM_BACKGROUNDS_BASE}/room3-garden-conservatory.png`,
} as const;

/**
 * UI element URLs
 */
export const uiAssets = {
  victoryScreen: `${UI_BASE}/victory-screen.png`,
  defeatScreen: `${UI_BASE}/defeat-screen.png`,
  loadingScreen: `${UI_BASE}/loading-screen.png`,
  puzzleFrame: `${UI_BASE}/puzzle-frame.png`,
  dialogBox: `${UI_BASE}/dialog-box.png`,
  inventorySlot: `${UI_BASE}/inventory-slot.png`,
  hintIcon: `${UI_BASE}/hint-icon.png`,
  settingsIcon: `${UI_BASE}/settings-icon.png`,
} as const;

/**
 * Particle effect URLs
 */
export const particleAssets = {
  dustMotes: `${PARTICLES_BASE}/dust-motes.png`,
  candleGlow: `${PARTICLES_BASE}/candle-glow.png`,
  magicSparkles: `${PARTICLES_BASE}/magic-sparkles.png`,
  smokeEffect: `${PARTICLES_BASE}/smoke-effect.png`,
  leavesParticles: `${PARTICLES_BASE}/leaves-particles.png`,
  clockworkGears: `${PARTICLES_BASE}/clockwork-gears.png`,
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
  cryptex: {
    name: 'Cryptex',
    description: 'Victorian cryptex cylinder puzzle with brass rotating rings',
    useCase: 'Code-breaking puzzles, combination locks',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  treasureChest: {
    name: 'Treasure Chest',
    description: 'Victorian treasure chest or strongbox with ornate brass fittings',
    useCase: 'Loot rewards, locked containers, discovery puzzles',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  mysteriousPainting: {
    name: 'Mysterious Painting',
    description: 'Victorian oil painting in ornate frame with hidden clues',
    useCase: 'Visual puzzles, art examination, hidden messages',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  mirrorReflection: {
    name: 'Mirror Reflection',
    description: 'Victorian ornate mirror with mysterious reflection',
    useCase: 'Mirror puzzles, supernatural elements, reflection riddles',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  pendulum: {
    name: 'Pendulum',
    description: 'Victorian pendulum mechanism with ornate brass bob and rod',
    useCase: 'Time puzzles, physics puzzles, clock mechanisms',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  musicBox: {
    name: 'Music Box',
    description: 'Victorian music box puzzle mechanism with ornate brass cylinder',
    useCase: 'Music puzzles, melody decoding, mechanical puzzles',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  bellCollection: {
    name: 'Bell Collection',
    description: 'Collection of Victorian brass bells of various sizes',
    useCase: 'Sound puzzles, bell ringing challenges, audio puzzles',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  botanicalHybrid: {
    name: 'Botanical Hybrid',
    description: 'Victorian botanical illustration of mysterious hybrid plant',
    useCase: 'Garden puzzles, plant breeding, scientific discovery',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  seedPackets: {
    name: 'Seed Packets',
    description: 'Collection of Victorian seed packets with botanical illustrations',
    useCase: 'Garden puzzles, planting mechanics, resource collection',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  glassVials: {
    name: 'Glass Vials',
    description: 'Collection of Victorian glass vials and potions with colored liquids',
    useCase: 'Alchemy puzzles, mixing mechanics, puzzle solutions',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  clockHands: {
    name: 'Clock Hands',
    description: 'Victorian ornate clock hands, antique brass hour and minute hands',
    useCase: 'Clock Face puzzle, Midnight Chime, time-based puzzles',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  gearsCollection: {
    name: 'Gears Collection',
    description: 'Collection of Victorian steampunk gears and cogs in various sizes',
    useCase: 'Music Box puzzle, Gear Alignment, mechanical puzzles',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  telegraphKey: {
    name: 'Telegraph Key',
    description: 'Antique Victorian telegraph key Morse code transmitter',
    useCase: 'Bell Codes puzzle, Morse code communication',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  botanicalIllustration: {
    name: 'Botanical Illustration',
    description: 'Victorian botanical illustration with scientific plant drawing',
    useCase: 'Garden puzzles, Hybridization, Seed Packets',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
} as const;

/**
 * Room background metadata
 */
export const roomBackgroundMeta = {
  room1Attic: {
    name: 'Room 1 - Attic',
    description: 'Dusty forgotten attic space with antique trunk, torn photographs, candle holders',
    useCase: 'Room 1 background, atmospheric setting',
    size: { width: 1920, height: 1080 },
    format: 'PNG',
    theme: 'Warm candlelight, dust, forgotten items'
  },
  room2ClockTower: {
    name: 'Room 2 - Clock Tower',
    description: 'Massive brass gears and clockwork mechanisms, golden light through clock face',
    useCase: 'Room 2 background, mechanical atmosphere',
    size: { width: 1920, height: 1080 },
    format: 'PNG',
    theme: 'Brass, gears, clockwork, golden light'
  },
  room3GardenConservatory: {
    name: 'Room 3 - Garden Conservatory',
    description: 'Glass roof with ethereal green light, exotic plants, botanical illustrations',
    useCase: 'Room 3 background, botanical atmosphere',
    size: { width: 1920, height: 1080 },
    format: 'PNG',
    theme: 'Glass, plants, ethereal green light'
  },
} as const;

/**
 * UI asset metadata
 */
export const uiAssetMeta = {
  victoryScreen: {
    name: 'Victory Screen',
    description: 'Victorian victory celebration with ornate golden frame',
    useCase: 'Game completion screen, success feedback',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  defeatScreen: {
    name: 'Defeat Screen',
    description: 'Dark moody game over screen with mysterious elements',
    useCase: 'Game over screen, failure feedback',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  loadingScreen: {
    name: 'Loading Screen',
    description: 'Victorian loading screen with clockwork gears',
    useCase: 'Loading screen, transitions',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  puzzleFrame: {
    name: 'Puzzle Frame',
    description: 'Victorian ornate puzzle frame with baroque scrollwork',
    useCase: 'Puzzle borders, UI frames',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  dialogBox: {
    name: 'Dialog Box',
    description: 'Victorian dialog box background with aged parchment texture',
    useCase: 'Dialog UI, narrative text display',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  inventorySlot: {
    name: 'Inventory Slot',
    description: 'Victorian inventory slot background with ornate frame',
    useCase: 'Item inventory, item display',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  hintIcon: {
    name: 'Hint Icon',
    description: 'Victorian hint icon with ornate decorative design',
    useCase: 'Hint button, help system',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  settingsIcon: {
    name: 'Settings Icon',
    description: 'Victorian settings gear icon with ornate design',
    useCase: 'Settings menu, configuration',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
} as const;

/**
 * Particle effect metadata
 */
export const particleAssetMeta = {
  dustMotes: {
    name: 'Dust Motes',
    description: 'Floating dust particles in light beam',
    useCase: 'Atmospheric effects, room ambiance',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  candleGlow: {
    name: 'Candle Glow',
    description: 'Warm golden light rays with flickering flame',
    useCase: 'Lighting effects, candle atmosphere',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  magicSparkles: {
    name: 'Magic Sparkles',
    description: 'Golden glowing particles with supernatural aesthetic',
    useCase: 'Puzzle success, magical effects',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  smokeEffect: {
    name: 'Smoke Effect',
    description: 'Atmospheric swirling smoke and fog',
    useCase: 'Atmosphere, mysterious fog effects',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  leavesParticles: {
    name: 'Leaves Particles',
    description: 'Falling autumn leaves for garden atmosphere',
    useCase: 'Garden room effects, botanical ambiance',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
  clockworkGears: {
    name: 'Clockwork Gears',
    description: 'Small gear silhouettes for mechanical effects',
    useCase: 'Clock tower effects, mechanical animations',
    size: { width: 512, height: 512 },
    format: 'PNG'
  },
} as const;

/**
 * Type for puzzle image keys
 */
export type PuzzleImageKey = keyof typeof puzzleImages;
export type RoomBackgroundKey = keyof typeof roomBackgrounds;
export type UIAssetKey = keyof typeof uiAssets;
export type ParticleAssetKey = keyof typeof particleAssets;

/**
 * Get puzzle image URL by key
 */
export function getPuzzleImage(key: PuzzleImageKey): string {
  return puzzleImages[key];
}

/**
 * Get room background URL by key
 */
export function getRoomBackground(key: RoomBackgroundKey): string {
  return roomBackgrounds[key];
}

/**
 * Get UI asset URL by key
 */
export function getUIAsset(key: UIAssetKey): string {
  return uiAssets[key];
}

/**
 * Get particle asset URL by key
 */
export function getParticleAsset(key: ParticleAssetKey): string {
  return particleAssets[key];
}

/**
 * Get puzzle image metadata by key
 */
export function getPuzzleImageMeta(key: PuzzleImageKey) {
  return puzzleImageMeta[key];
}

/**
 * Get room background metadata by key
 */
export function getRoomBackgroundMeta(key: RoomBackgroundKey) {
  return roomBackgroundMeta[key];
}

/**
 * Get UI asset metadata by key
 */
export function getUIAssetMeta(key: UIAssetKey) {
  return uiAssetMeta[key];
}

/**
 * Get particle asset metadata by key
 */
export function getParticleAssetMeta(key: ParticleAssetKey) {
  return particleAssetMeta[key];
}

/**
 * Room-specific asset mappings with comprehensive coverage
 */
export const roomAssetMapping = {
  room1: {
    attic: {
      // Background
      background: roomBackgrounds.room1Attic,
      // Torn Photographs puzzle
      photographPiece: puzzleImages.cluePhotograph,
      mirror: puzzleImages.mirrorReflection,
      // Love Letter Cipher puzzle
      loveLetter: puzzleImages.clueLetter,
      candle: puzzleImages.candleHolder,
      // Secret Message puzzle
      secretNote: puzzleImages.clueNote,
      magnifyingGlass: puzzleImages.magnifyingGlass,
      // Trunk Lock puzzle
      lock: puzzleImages.vintageLock,
      keys: puzzleImages.antiqueKeys,
      treasureChest: puzzleImages.treasureChest,
      // Additional room 1 assets
      mysteriousPainting: puzzleImages.mysteriousPainting,
      // Particles
      particles: {
        dust: particleAssets.dustMotes,
        candleGlow: particleAssets.candleGlow,
        magic: particleAssets.magicSparkles,
      },
    }
  },
  room2: {
    clockTower: {
      // Background
      background: roomBackgrounds.room2ClockTower,
      // Clock-themed puzzles
      hourglass: puzzleImages.hourglass,
      pendulum: puzzleImages.pendulum,
      compass: puzzleImages.compass,
      codebook: puzzleImages.codebook,
      // Mechanical assets
      clockHands: puzzleImages.clockHands,
      gears: puzzleImages.gearsCollection,
      telegraphKey: puzzleImages.telegraphKey,
      musicBox: puzzleImages.musicBox,
      bellCollection: puzzleImages.bellCollection,
      cryptex: puzzleImages.cryptex,
      // Particles
      particles: {
        clockwork: particleAssets.clockworkGears,
        smoke: particleAssets.smokeEffect,
        magic: particleAssets.magicSparkles,
      },
    }
  },
  room3: {
    gardenConservatory: {
      // Background
      background: roomBackgrounds.room3GardenConservatory,
      // Garden-themed puzzles
      treasureMap: puzzleImages.treasureMap,
      cipherWheel: puzzleImages.cipherWheel,
      mysteriousGlyphs: puzzleImages.mysteriousGlyphs,
      // Botanical assets
      botanical: puzzleImages.botanicalIllustration,
      botanicalHybrid: puzzleImages.botanicalHybrid,
      seedPackets: puzzleImages.seedPackets,
      glassVials: puzzleImages.glassVials,
      // Additional room 3 assets
      secretCompartment: puzzleImages.secretCompartment,
      // Particles
      particles: {
        leaves: particleAssets.leavesParticles,
        magic: particleAssets.magicSparkles,
        dust: particleAssets.dustMotes,
      },
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
    puzzle: uiAssets.puzzleFrame,
    inventory: uiAssets.inventorySlot,
  },
  tools: {
    magnifyingGlass: puzzleImages.magnifyingGlass,
    compass: puzzleImages.compass,
    hint: uiAssets.hintIcon,
    settings: uiAssets.settingsIcon,
  },
  decorative: {
    candleHolder: puzzleImages.candleHolder,
    hourglass: puzzleImages.hourglass,
  },
  screens: {
    victory: uiAssets.victoryScreen,
    defeat: uiAssets.defeatScreen,
    loading: uiAssets.loadingScreen,
  },
  dialogs: {
    box: uiAssets.dialogBox,
  },
} as const;

/**
 * Particle system mappings for room-specific effects
 */
export const particleSystemMapping = {
  room1: {
    default: particleAssets.dustMotes,
    ambient: [particleAssets.dustMotes, particleAssets.candleGlow],
    puzzleSuccess: [particleAssets.magicSparkles],
  },
  room2: {
    default: particleAssets.clockworkGears,
    ambient: [particleAssets.clockworkGears, particleAssets.smokeEffect],
    puzzleSuccess: [particleAssets.magicSparkles, particleAssets.smokeEffect],
  },
  room3: {
    default: particleAssets.leavesParticles,
    ambient: [particleAssets.leavesParticles, particleAssets.dustMotes],
    puzzleSuccess: [particleAssets.magicSparkles, particleAssets.leavesParticles],
  },
} as const;

/**
 * Helper function to get room-specific particle effects
 */
export function getRoomParticles(roomNumber: 1 | 2 | 3, effectType: 'default' | 'ambient' | 'puzzleSuccess' = 'default'): string | string[] {
  const room = `room${roomNumber}` as const;
  return particleSystemMapping[room][effectType];
}

/**
 * Helper function to get all assets for a room
 */
export function getRoomAssets(roomNumber: 1 | 2 | 3) {
  const room = `room${roomNumber}` as const;
  return roomAssetMapping[room];
}

// Default export for backward compatibility
export default puzzleImages;
