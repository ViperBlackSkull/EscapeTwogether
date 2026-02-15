/**
 * Room 2 (Clock Tower) Puzzle SVG Assets
 *
 * These SVGs feature a steampunk/Victorian aesthetic with warm metallic colors:
 * - Warm amber (#FFB74D)
 * - Antique gold (#D4A574)
 * - Brass (#B8860B)
 *
 * All SVGs include:
 * - Scalable viewBox for responsive sizing
 * - Gradient effects for metallic sheen
 * - Glow filters for active states (controlled via CSS opacity)
 * - Shadow effects for depth
 */

// Import SVG files as raw strings using Vite's ?raw import
import bellRaw from './bell.svg?raw';
import pendulumRaw from './pendulum.svg?raw';
import gearRaw from './gear.svg?raw';
import clockFaceRaw from './clock-face.svg?raw';
import windupKeyRaw from './windup-key.svg?raw';
import chimeHammerRaw from './chime-hammer.svg?raw';

/**
 * Antique brass bell with rope, Victorian clock tower style.
 * Features decorative mount, clapper, and tasseled rope.
 * Active glow: .bell-glow { opacity: 1; }
 */
export const bell = bellRaw;

/**
 * Grandfather clock pendulum with ornate detailing.
 * Features mounting bracket, decorative rod, and lens-style bob.
 * Active glow: .pendulum-glow { opacity: 1; }
 */
export const pendulum = pendulumRaw;

/**
 * Steampunk brass gears in multiple sizes (large, medium, small, tiny).
 * Perfect for clockwork mechanism visualizations.
 * Active glow: .gear-glow { opacity: 1; }
 */
export const gear = gearRaw;

/**
 * Elegant Roman numeral clock face with decorative hands.
 * Shows 10:10 position (classic watch display).
 * Active glow: .clock-glow { opacity: 1; }
 */
export const clockFace = clockFaceRaw;

/**
 * Ornate clockwork winding key with decorative wooden handle.
 * Features Victorian flourishes and decorative rings.
 * Active glow: .windup-glow { opacity: 1; }
 */
export const windupKey = windupKeyRaw;

/**
 * Clock tower chime mechanism hammer.
 * Features pivot mechanism, spring, and felt striking surface.
 * Active glow: .hammer-glow { opacity: 1; }
 * Sound waves: .sound-waves { opacity: 0.5; }
 */
export const chimeHammer = chimeHammerRaw;

/**
 * Object containing all Room 2 SVG assets as raw strings.
 * Useful for dynamic imports or mapping.
 */
export const room2Assets = {
  bell,
  pendulum,
  gear,
  clockFace,
  windupKey,
  chimeHammer
} as const;

/**
 * Asset metadata for Room 2 puzzle elements
 */
export const room2AssetMeta = {
  bell: {
    name: 'Antique Bell',
    description: 'Victorian clock tower brass bell with rope',
    viewBox: '0 0 120 180',
    glowClass: 'bell-glow'
  },
  pendulum: {
    name: 'Grandfather Clock Pendulum',
    description: 'Ornate pendulum with lens-style bob',
    viewBox: '0 0 80 200',
    glowClass: 'pendulum-glow'
  },
  gear: {
    name: 'Steampunk Gears',
    description: 'Multiple brass gears in various sizes',
    viewBox: '0 0 200 200',
    glowClass: 'gear-glow'
  },
  clockFace: {
    name: 'Roman Numeral Clock Face',
    description: 'Elegant clock face with Roman numerals',
    viewBox: '0 0 200 200',
    glowClass: 'clock-glow'
  },
  windupKey: {
    name: 'Clockwork Windup Key',
    description: 'Ornate winding key with wooden handle',
    viewBox: '0 0 140 160',
    glowClass: 'windup-glow'
  },
  chimeHammer: {
    name: 'Chime Hammer',
    description: 'Clock tower chime mechanism hammer',
    viewBox: '0 0 160 100',
    glowClass: 'hammer-glow'
  }
} as const;

/**
 * Type for Room 2 asset keys
 */
export type Room2AssetKey = keyof typeof room2Assets;

/**
 * Helper to create a blob URL from an SVG string
 */
export function createSvgBlobUrl(svgString: string): string {
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
}

/**
 * Helper to revoke blob URL when no longer needed
 */
export function revokeSvgBlobUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Helper to get SVG as a data URL (for inline use)
 */
export function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svgString)}`;
}

export default room2Assets;
