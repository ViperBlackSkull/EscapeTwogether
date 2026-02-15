/**
 * Room 3 (Garden Conservatory) Puzzle SVG Assets
 *
 * These SVG assets are designed for the Garden Conservatory puzzles in EscapeTwogether.
 * They feature a botanical/nature aesthetic with soft organic shapes and animations.
 *
 * Color Palette:
 * - Teal: #4ECDC4 (primary)
 * - Amber: #FFB74D (warm accent)
 * - Rose: #F38181 (floral accent)
 * - Lavender: #AA96DA (secondary accent)
 */

// Import SVG files as raw strings using Vite's ?raw suffix
import seedPacketSvg from './seed-packet.svg?raw';
import flowerPotSvg from './flower-pot.svg?raw';
import wateringCanSvg from './watering-can.svg?raw';
import prismSvg from './prism.svg?raw';
import trellisSvg from './trellis.svg?raw';
import bloomSvg from './bloom.svg?raw';
import butterflySvg from './butterfly.svg?raw';

/**
 * Vintage botanical seed envelope with floral illustration
 * Used for: Seed Packets puzzle
 */
export const seedPacket = seedPacketSvg;

/**
 * Terracotta pot with soil and sprouting plant
 * Features animated sprouting leaves
 * Used for: Planting/growth puzzles
 */
export const flowerPot = flowerPotSvg;

/**
 * Antique copper watering can with rose spout
 * Features animated water droplets
 * Used for: Water Flow puzzle
 */
export const wateringCan = wateringCanSvg;

/**
 * Crystal glass prism that splits light into rainbow
 * Features animated spectral dispersion beams
 * Used for: Light Spectrum puzzle
 */
export const prism = prismSvg;

/**
 * Wooden garden trellis with climbing vine pattern
 * Features animated vine growth and flowers
 * Used for: Trellis puzzle
 */
export const trellis = trellisSvg;

/**
 * Beautiful flower bloom in multiple stages (bud, opening, full bloom)
 * Features pulsing glow animations for full bloom
 * Used for: Bloom Timing puzzle, Final Bloom puzzle
 */
export const bloom = bloomSvg;

/**
 * Delicate butterfly with wing patterns
 * Features wing flapping animation and shimmer effects
 * Used for: Garden ambiance, decorative elements
 */
export const butterfly = butterflySvg;

/**
 * Object containing all Room 3 SVG assets
 * Useful for dynamic imports or iteration
 */
export const room3Assets = {
  seedPacket,
  flowerPot,
  wateringCan,
  prism,
  trellis,
  bloom,
  butterfly,
} as const;

/**
 * Array of all Room 3 SVG asset entries
 * Each entry contains the asset name and SVG content
 */
export const room3AssetEntries = Object.entries(room3Assets) as Array<
  [keyof typeof room3Assets, string]
>;

/**
 * Get an SVG asset by name
 * @param name - The asset name (seedPacket, flowerPot, etc.)
 * @returns The SVG content as a string, or undefined if not found
 */
export function getRoom3Asset(name: keyof typeof room3Assets): string | undefined {
  return room3Assets[name];
}

/**
 * Type for Room 3 asset names
 */
export type Room3AssetName = keyof typeof room3Assets;

export default room3Assets;
