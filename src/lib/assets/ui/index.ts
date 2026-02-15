/**
 * EscapeTwogether - Decorative UI SVG Assets
 *
 * This module exports all Victorian-style decorative UI assets for the game.
 * These assets use a warm color palette matching the romantic/mysterious theme:
 * - Warm Amber: #FFB74D
 * - Antique Gold: #D4A574
 * - Dusty Rose: #F4D0C3
 *
 * All assets include subtle animations and are designed for the game's aesthetic.
 */

// SVG Asset Paths - import as raw SVG strings for inline use
export const svgAssets = {
  // Decorative border frame for panels and cards
  ornateBorder: './ornate-border.svg',

  // Corner flourishes in 4 orientations (top-left, top-right, bottom-left, bottom-right)
  cornerFlourish: './corner-flourish.svg',

  // Elegant horizontal divider with center ornament
  divider: './divider.svg',

  // Ornate button background/border with shimmer effect
  buttonFrame: './button-frame.svg',

  // Flickering candle with soft ambient glow
  candle: './candle.svg',

  // Antique ornate key with decorative bow
  key: './key.svg',

  // Decorative padlock with locked/unlocked states (use .unlocked class)
  lock: './lock.svg',

  // Aged parchment scroll with wax seal
  scroll: './scroll.svg',

  // Antique compass rose with rotating needle animation
  compass: './compass.svg',

  // Star rating icons (empty, half, full states)
  stars: './stars.svg',
} as const;

// Type for asset keys
export type SvgAssetKey = keyof typeof svgAssets;

// Asset metadata for documentation
export const assetMetadata = {
  ornateBorder: {
    description: 'Victorian-style decorative border frame for panels and cards',
    dimensions: { width: 400, height: 300 },
    animations: ['border-glow', 'corner-pulse'],
    usage: 'Use as a frame container for content panels',
  },
  cornerFlourish: {
    description: 'Decorative corner ornaments in all 4 orientations',
    dimensions: { width: 100, height: 100 },
    animations: ['flourish-glow'],
    usage: 'Place at corners of panels, cards, or decorative elements',
  },
  divider: {
    description: 'Elegant horizontal divider with center diamond ornament',
    dimensions: { width: 400, height: 40 },
    animations: ['line-glow', 'center-pulse'],
    usage: 'Separate content sections with decorative styling',
  },
  buttonFrame: {
    description: 'Ornate button background with corner flourishes and shimmer',
    dimensions: { width: 200, height: 60 },
    animations: ['border-glow', 'shimmer'],
    usage: 'Frame for important action buttons',
  },
  candle: {
    description: 'Flickering candle with realistic flame animation and ambient glow',
    dimensions: { width: 60, height: 120 },
    animations: ['flame-flicker', 'glow-pulse', 'sparkle-rise'],
    usage: 'Ambient decoration for mysterious atmosphere',
  },
  key: {
    description: 'Antique ornate key with decorative bow and teeth',
    dimensions: { width: 120, height: 60 },
    animations: ['shimmer'],
    usage: 'Collectible item or puzzle element indicator',
  },
  lock: {
    description: 'Decorative padlock with locked and unlocked states',
    dimensions: { width: 80, height: 100 },
    animations: ['lock-glow', 'unlock-indicator'],
    usage: 'Toggle .unlocked class to switch between states',
  },
  scroll: {
    description: 'Aged parchment scroll with rolled edges and wax seal',
    dimensions: { width: 200, height: 280 },
    animations: ['border-glow', 'seal-pulse'],
    usage: 'Container for narrative text or puzzle clues',
  },
  compass: {
    description: 'Antique compass rose with gently swaying needle',
    dimensions: { width: 100, height: 100 },
    animations: ['needle-sway', 'center-glow'],
    usage: 'Navigation element or directional puzzle hint',
  },
  stars: {
    description: 'Star rating icons with empty, half, and full states',
    dimensions: { width: 180, height: 60 },
    animations: ['star-glow', 'sparkle'],
    usage: 'Rating display or progress indicator',
  },
} as const;

// CSS Animation Keyframes for use with these assets
export const animationKeyframes = `
/* ===========================================
   UI ASSET ANIMATIONS
   =========================================== */

/* Flickering glow effect for candles and flames */
@keyframes flicker {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  25% { opacity: 0.9; transform: scale(1.02); }
  50% { opacity: 0.7; transform: scale(0.98); }
  75% { opacity: 0.95; transform: scale(1.01); }
}

/* Soft pulsing glow for borders and frames */
@keyframes glow-pulse {
  0%, 100% { filter: drop-shadow(0 0 4px rgba(255, 183, 77, 0.4)); }
  50% { filter: drop-shadow(0 0 8px rgba(255, 183, 77, 0.7)); }
}

/* Shimmer effect for buttons and keys */
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

/* Gentle sway for compass needle */
@keyframes needle-sway {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(3deg); }
  75% { transform: rotate(-3deg); }
}

/* Sparkle rise animation for particles */
@keyframes sparkle-rise {
  0% { transform: translateY(0) scale(1); opacity: 0.8; }
  50% { opacity: 0.4; }
  100% { transform: translateY(-20px) scale(0); opacity: 0; }
}

/* Subtle breathing effect for decorative elements */
@keyframes breathe {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

/* Fade in animation */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Scale in animation */
@keyframes scale-in {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Float animation for ambient elements */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

/* Animation utility classes */
.animate-flicker {
  animation: flicker 0.3s ease-in-out infinite;
}

.animate-glow-pulse {
  animation: glow-pulse 3s ease-in-out infinite;
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 183, 77, 0.3) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

.animate-needle-sway {
  animation: needle-sway 8s ease-in-out infinite;
  transform-origin: center center;
}

.animate-breathe {
  animation: breathe 3s ease-in-out infinite;
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}

.animate-scale-in {
  animation: scale-in 0.3s ease-out forwards;
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .animate-flicker,
  .animate-glow-pulse,
  .animate-shimmer,
  .animate-needle-sway,
  .animate-breathe,
  .animate-float {
    animation: none;
  }

  .animate-fade-in,
  .animate-scale-in {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
`;

// Helper function to get SVG asset URL
export function getAssetUrl(key: SvgAssetKey): string {
  return svgAssets[key];
}

// Helper to apply animation class to an element
export function applyAnimation(element: HTMLElement, animationClass: string): void {
  element.classList.add(animationClass);
}

// Color palette for reference
export const colors = {
  warmAmber: '#FFB74D',
  antiqueGold: '#D4A574',
  dustyRose: '#F4D0C3',
  deepNavy: '#1a1a2e',
  softBlack: '#0f0f1a',
  softTeal: '#4a9b8c',
} as const;

export type ColorKey = keyof typeof colors;

// Helper to get color value
export function getColor(key: ColorKey): string {
  return colors[key];
}

export default {
  svgAssets,
  assetMetadata,
  animationKeyframes,
  colors,
  getAssetUrl,
  getColor,
  applyAnimation,
};
