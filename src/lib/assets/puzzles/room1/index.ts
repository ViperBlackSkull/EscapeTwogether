/**
 * Room 1 (Attic) Puzzle Assets
 *
 * SVG assets for the attic room puzzles in EscapeTwogether.
 * These are imported as raw strings for use with Vite's ?raw import feature.
 *
 * Color Palette:
 * - Warm Amber: #FFB74D
 * - Dusty Rose: #F4D0C3
 * - Deep Navy: #1E293B
 */

// Import SVG files as raw strings using Vite's ?raw suffix
import tornPhotographRaw from './torn-photograph.svg?raw';
import musicBoxRaw from './music-box.svg?raw';
import loveLetterRaw from './love-letter.svg?raw';
import secretMessageRaw from './secret-message.svg?raw';
import trunkLockRaw from './trunk-lock.svg?raw';

/**
 * Torn Photograph SVG
 * Vintage sepia photograph pieces with torn/ragged edges
 * Features a romantic couple theme with scattered pieces
 */
export const tornPhotograph = tornPhotographRaw;

/**
 * Music Box SVG
 * Ornate antique music box with visible mechanical gears
 * Victorian design with animated rotating gears
 */
export const musicBox = musicBoxRaw;

/**
 * Love Letter SVG
 * Aged parchment letter with romantic script styling
 * Features a red wax seal with heart impression
 */
export const loveLetter = loveLetterRaw;

/**
 * Secret Message SVG
 * Old envelope with hidden compartment
 * Mysterious appearance with key symbol on wax seal
 */
export const secretMessage = secretMessageRaw;

/**
 * Trunk Lock SVG
 * Antique brass trunk lock with rotating dials
 * Steampunk elements with animated gear decorations
 */
export const trunkLock = trunkLockRaw;

/**
 * All Room 1 puzzle assets as a collection
 */
export const room1Assets = {
  tornPhotograph,
  musicBox,
  loveLetter,
  secretMessage,
  trunkLock
} as const;

/**
 * Asset metadata for Room 1 puzzles
 */
export const room1AssetMeta = {
  tornPhotograph: {
    name: 'Torn Photograph',
    description: 'Vintage sepia photograph pieces that need to be reassembled',
    puzzleId: 'puzzle-1',
    interactive: true
  },
  musicBox: {
    name: 'Music Box',
    description: 'Ornate Victorian music box with mechanical gears',
    puzzleId: 'puzzle-2',
    interactive: true
  },
  loveLetter: {
    name: 'Love Letter',
    description: 'Aged romantic letter with cipher to decode',
    puzzleId: 'puzzle-3',
    interactive: true
  },
  secretMessage: {
    name: 'Secret Message',
    description: 'Mysterious envelope containing hidden message',
    puzzleId: 'puzzle-4',
    interactive: true
  },
  trunkLock: {
    name: 'Trunk Lock',
    description: 'Antique brass lock with rotating combination dials',
    puzzleId: 'puzzle-5',
    interactive: true
  }
} as const;

/**
 * Type for Room 1 asset keys
 */
export type Room1AssetKey = keyof typeof room1Assets;

/**
 * Get SVG asset by key
 */
export function getRoom1Asset(key: Room1AssetKey): string {
  return room1Assets[key];
}

/**
 * Get asset metadata by key
 */
export function getRoom1AssetMeta(key: Room1AssetKey) {
  return room1AssetMeta[key];
}

/**
 * Create an SVG element from asset string
 * @param svgString - Raw SVG string
 * @returns SVG Element or null if parsing fails
 */
export function createSVGElement(svgString: string): SVGSVGElement | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  return doc.querySelector('svg');
}

/**
 * Inject SVG into a container element
 * @param container - Target container element
 * @param svgString - Raw SVG string
 * @returns The injected SVG element or null
 */
export function injectSVG(container: HTMLElement, svgString: string): SVGSVGElement | null {
  const svgElement = createSVGElement(svgString);
  if (svgElement) {
    container.innerHTML = '';
    container.appendChild(svgElement);
  }
  return svgElement;
}

export default room1Assets;
