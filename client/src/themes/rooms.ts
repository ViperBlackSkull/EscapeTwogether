export interface RoomTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    primaryGlow: string;
    secondary: string;
    secondaryGlow: string;
    accent: string;
    accentGlow: string;
    bgGradientStart: string;
    bgGradientMid: string;
    bgGradientEnd: string;
    particleColor: string;
    spotlightColor: string;
    borderColor: string;
    borderGlow: string;
  };
  particles: {
    count: number;
    sizeRange: [number, number];
    speedRange: [number, number];
    driftRange: [number, number];
    opacityRange: [number, number];
    shape: 'circle' | 'square' | 'diamond' | 'spark';
  };
  patterns: {
    gridOpacity: number;
    gridColor: string;
    vignetteStrength: number;
  };
  icons: string[];
}

export const ROOM_THEMES: RoomTheme[] = [
  {
    id: 'workshop',
    name: 'The Workshop',
    colors: {
      primary: '#8B4513',
      primaryGlow: 'rgba(139, 69, 19, 0.3)',
      secondary: '#D2691E',
      secondaryGlow: 'rgba(210, 105, 30, 0.3)',
      accent: '#F4A460',
      accentGlow: 'rgba(244, 164, 96, 0.3)',
      bgGradientStart: '#1a0f05',
      bgGradientMid: '#1a1008',
      bgGradientEnd: '#0d0a04',
      particleColor: '#D2691E',
      spotlightColor: 'rgba(210, 105, 30, 0.06)',
      borderColor: 'rgba(139, 69, 19, 0.25)',
      borderGlow: 'rgba(210, 105, 30, 0.15)',
    },
    particles: {
      count: 10,
      sizeRange: [2, 4],
      speedRange: [8, 14],
      driftRange: [15, 30],
      opacityRange: [0.15, 0.35],
      shape: 'spark',
    },
    patterns: {
      gridOpacity: 0.02,
      gridColor: '#8B4513',
      vignetteStrength: 0.4,
    },
    icons: ['wrench', 'gear', 'hammer', 'screwdriver'],
  },
  {
    id: 'laboratory',
    name: 'The Laboratory',
    colors: {
      primary: '#008B8B',
      primaryGlow: 'rgba(0, 139, 139, 0.3)',
      secondary: '#20B2AA',
      secondaryGlow: 'rgba(32, 178, 170, 0.3)',
      accent: '#48D1CC',
      accentGlow: 'rgba(72, 209, 204, 0.3)',
      bgGradientStart: '#041414',
      bgGradientMid: '#081a1a',
      bgGradientEnd: '#030d0d',
      particleColor: '#20B2AA',
      spotlightColor: 'rgba(32, 178, 170, 0.06)',
      borderColor: 'rgba(0, 139, 139, 0.25)',
      borderGlow: 'rgba(32, 178, 170, 0.15)',
    },
    particles: {
      count: 16,
      sizeRange: [2, 5],
      speedRange: [10, 18],
      driftRange: [20, 40],
      opacityRange: [0.1, 0.3],
      shape: 'circle',
    },
    patterns: {
      gridOpacity: 0.03,
      gridColor: '#008B8B',
      vignetteStrength: 0.35,
    },
    icons: ['flask', 'atom', 'molecule', 'dna'],
  },
  {
    id: 'vault',
    name: 'The Vault',
    colors: {
      primary: '#B8860B',
      primaryGlow: 'rgba(184, 134, 11, 0.3)',
      secondary: '#708090',
      secondaryGlow: 'rgba(112, 128, 144, 0.3)',
      accent: '#DAA520',
      accentGlow: 'rgba(218, 165, 32, 0.3)',
      bgGradientStart: '#0f0d05',
      bgGradientMid: '#14120a',
      bgGradientEnd: '#0a0906',
      particleColor: '#B8860B',
      spotlightColor: 'rgba(184, 134, 11, 0.06)',
      borderColor: 'rgba(184, 134, 11, 0.25)',
      borderGlow: 'rgba(218, 165, 32, 0.15)',
    },
    particles: {
      count: 8,
      sizeRange: [1, 3],
      speedRange: [12, 20],
      driftRange: [10, 25],
      opacityRange: [0.1, 0.25],
      shape: 'diamond',
    },
    patterns: {
      gridOpacity: 0.015,
      gridColor: '#708090',
      vignetteStrength: 0.5,
    },
    icons: ['lock', 'key', 'shield', 'chain'],
  },
];

export function getRoomTheme(roomIndex: number): RoomTheme {
  return ROOM_THEMES[roomIndex] ?? ROOM_THEMES[0];
}
