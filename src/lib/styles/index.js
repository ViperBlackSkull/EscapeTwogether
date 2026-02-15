/**
 * EscapeTwogether Design System
 *
 * This module exports the design system tokens and utilities
 * for use throughout the application.
 *
 * Usage:
 * import { colors, spacing, typography } from '$lib/styles';
 */

// Design Token Exports
export const colors = {
  // Background Colors
  bg: {
    primary: '#0f0f23',
    secondary: '#1a1a2e',
    tertiary: '#16213e',
    elevated: '#1f1f3a',
    overlay: 'rgba(15, 15, 35, 0.85)'
  },

  // Accent Colors
  accent: {
    gold: '#d4af37',
    goldLight: '#e5c76b',
    goldDark: '#b8960f',
    goldMuted: 'rgba(212, 175, 55, 0.15)'
  },

  // Text Colors
  text: {
    primary: '#f5f5f5',
    secondary: '#a0a0b0',
    muted: '#6b6b7b',
    disabled: '#4a4a5a',
    inverse: '#0f0f23'
  },

  // Semantic Colors
  success: '#4ade80',
  successMuted: 'rgba(74, 222, 128, 0.15)',
  warning: '#fbbf24',
  warningMuted: 'rgba(251, 191, 36, 0.15)',
  error: '#f87171',
  errorMuted: 'rgba(248, 113, 113, 0.15)',
  info: '#60a5fa',
  infoMuted: 'rgba(96, 165, 250, 0.15)',

  // Legacy Palette (backwards compatibility)
  legacy: {
    deepNavy: '#1a1a2e',
    softBlack: '#0f0f1a',
    dustyRose: '#c9a9a6',
    antiqueGold: '#8b7355',
    warmAmber: '#f4a460',
    softTeal: '#4a9b8c'
  }
};

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem'    // 64px
};

export const typography = {
  fontFamily: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "'Playfair Display', Georgia, serif"
  },

  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem'      // 48px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },

  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2
  }
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',  // 4px
  md: '0.5rem',   // 8px
  lg: '0.75rem',  // 12px
  xl: '1rem',     // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px'
};

export const shadows = {
  subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.15)',
  sm: '0 2px 4px 0 rgba(0, 0, 0, 0.2)',
  md: '0 4px 8px 0 rgba(0, 0, 0, 0.25)',
  lg: '0 8px 16px 0 rgba(0, 0, 0, 0.3)',
  xl: '0 16px 32px 0 rgba(0, 0, 0, 0.35)',
  insetSm: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.15)',
  insetMd: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
  gold: '0 4px 16px 0 rgba(212, 175, 55, 0.25)',
  goldLg: '0 8px 32px 0 rgba(212, 175, 55, 0.3)'
};

export const transitions = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    slower: '500ms'
  },

  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },

  presets: {
    colors: 'color 150ms ease-in-out, background-color 150ms ease-in-out, border-color 150ms ease-in-out',
    transform: 'transform 250ms ease-out',
    opacity: 'opacity 150ms ease-in-out',
    shadow: 'box-shadow 250ms ease-out',
    all: 'all 250ms ease-in-out'
  }
};

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  toast: 600,
  tooltip: 700,
  max: 9999
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Component sizing constants
export const components = {
  button: {
    heightSm: '2rem',    // 32px
    heightMd: '2.5rem',  // 40px
    heightLg: '3rem'     // 48px
  },

  input: {
    heightSm: '2rem',    // 32px
    heightMd: '2.5rem',  // 40px
    heightLg: '3rem'     // 48px
  },

  icon: {
    xs: '0.75rem',   // 12px
    sm: '1rem',      // 16px
    md: '1.25rem',   // 20px
    lg: '1.5rem',    // 24px
    xl: '2rem'       // 32px
  }
};

// CSS custom property names for use in JavaScript
export const cssVariables = {
  // Returns CSS variable reference string
  get: (name) => `var(--${name})`,

  // Common variable references
  colors: {
    bgPrimary: 'var(--color-bg-primary)',
    bgSecondary: 'var(--color-bg-secondary)',
    bgTertiary: 'var(--color-bg-tertiary)',
    bgElevated: 'var(--color-bg-elevated)',
    accentGold: 'var(--color-accent-gold)',
    textPrimary: 'var(--color-text-primary)',
    textSecondary: 'var(--color-text-secondary)',
    textMuted: 'var(--color-text-muted)'
  },

  spacing: {
    xs: 'var(--space-xs)',
    sm: 'var(--space-sm)',
    md: 'var(--space-md)',
    lg: 'var(--space-lg)',
    xl: 'var(--space-xl)',
    '2xl': 'var(--space-2xl)'
  },

  transitions: {
    fast: 'var(--duration-fast)',
    normal: 'var(--duration-normal)',
    slow: 'var(--duration-slow)'
  }
};

export default {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  components,
  cssVariables
};
