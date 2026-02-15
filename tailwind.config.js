/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			/* ========================================
			   COLOR PALETTE - Design System Tokens
			   ======================================== */
			colors: {
				// Background Colors
				'bg-primary': '#0f0f23',
				'bg-secondary': '#1a1a2e',
				'bg-tertiary': '#16213e',
				'bg-elevated': '#1f1f3a',

				// Accent Colors - Gold
				'accent-gold': {
					DEFAULT: '#d4af37',
					light: '#e5c76b',
					dark: '#b8960f',
					muted: 'rgba(212, 175, 55, 0.15)'
				},

				// Text Colors
				'text-primary': '#f5f5f5',
				'text-secondary': '#a0a0b0',
				'text-muted': '#6b6b7b',
				'text-disabled': '#4a4a5a',
				'text-inverse': '#0f0f23',

				// Semantic Colors
				success: {
					DEFAULT: '#4ade80',
					muted: 'rgba(74, 222, 128, 0.15)'
				},
				warning: {
					DEFAULT: '#fbbf24',
					muted: 'rgba(251, 191, 36, 0.15)'
				},
				error: {
					DEFAULT: '#f87171',
					muted: 'rgba(248, 113, 113, 0.15)'
				},
				info: {
					DEFAULT: '#60a5fa',
					muted: 'rgba(96, 165, 250, 0.15)'
				},

				// Legacy palette (kept for backwards compatibility)
				'deep-navy': '#1a1a2e',
				'soft-black': '#0f0f1a',
				'dusty-rose': '#c9a9a6',
				'antique-gold': '#8b7355',
				'warm-amber': '#f4a460',
				'soft-teal': '#4a9b8c'
			},

			/* ========================================
			   TYPOGRAPHY - Font Families & Scale
			   ======================================== */
			fontFamily: {
				primary: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
				display: ['Playfair Display', 'Georgia', 'serif']
			},

			fontSize: {
				'xs': ['0.75rem', { lineHeight: '1rem' }],      /* 12px */
				'sm': ['0.875rem', { lineHeight: '1.25rem' }],  /* 14px */
				'base': ['1rem', { lineHeight: '1.5rem' }],     /* 16px */
				'lg': ['1.125rem', { lineHeight: '1.75rem' }],  /* 18px */
				'xl': ['1.25rem', { lineHeight: '1.75rem' }],   /* 20px */
				'2xl': ['1.5rem', { lineHeight: '2rem' }],      /* 24px */
				'3xl': ['1.875rem', { lineHeight: '2.25rem' }], /* 30px */
				'4xl': ['2.25rem', { lineHeight: '2.5rem' }],   /* 36px */
				'5xl': ['3rem', { lineHeight: '1' }]            /* 48px */
			},

			/* ========================================
			   SPACING SCALE
			   ======================================== */
			spacing: {
				'xs': '0.25rem',   /* 4px */
				'sm': '0.5rem',    /* 8px */
				'md': '1rem',      /* 16px */
				'lg': '1.5rem',    /* 24px */
				'xl': '2rem',      /* 32px */
				'2xl': '3rem',     /* 48px */
				'3xl': '4rem'      /* 64px */
			},

			/* ========================================
			   BORDER RADIUS SCALE
			   ======================================== */
			borderRadius: {
				'none': '0',
				'sm': '0.25rem',    /* 4px */
				'md': '0.5rem',     /* 8px */
				'lg': '0.75rem',    /* 12px */
				'xl': '1rem',       /* 16px */
				'2xl': '1.5rem',    /* 24px */
				'full': '9999px'
			},

			/* ========================================
			   BOX SHADOW SCALE (Subtle, Professional)
			   ======================================== */
			boxShadow: {
				'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.15)',
				'sm': '0 2px 4px 0 rgba(0, 0, 0, 0.2)',
				'md': '0 4px 8px 0 rgba(0, 0, 0, 0.25)',
				'lg': '0 8px 16px 0 rgba(0, 0, 0, 0.3)',
				'xl': '0 16px 32px 0 rgba(0, 0, 0, 0.35)',
				'inset-sm': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.15)',
				'inset-md': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
				'gold': '0 4px 16px 0 rgba(212, 175, 55, 0.25)',
				'gold-lg': '0 8px 32px 0 rgba(212, 175, 55, 0.3)'
			},

			/* ========================================
			   TRANSITIONS & ANIMATIONS
			   ======================================== */
			transitionDuration: {
				'fast': '150ms',
				'normal': '250ms',
				'slow': '350ms',
				'slower': '500ms'
			},

			transitionTimingFunction: {
				'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
			},

			animation: {
				'fade-in': 'fadeIn 250ms ease-out',
				'fade-out': 'fadeOut 250ms ease-out',
				'slide-in-up': 'slideInUp 250ms ease-out',
				'slide-in-down': 'slideInDown 250ms ease-out'
			},

			keyframes: {
				fadeIn: {
					'from': { opacity: '0' },
					'to': { opacity: '1' }
				},
				fadeOut: {
					'from': { opacity: '1' },
					'to': { opacity: '0' }
				},
				slideInUp: {
					'from': { opacity: '0', transform: 'translateY(10px)' },
					'to': { opacity: '1', transform: 'translateY(0)' }
				},
				slideInDown: {
					'from': { opacity: '0', transform: 'translateY(-10px)' },
					'to': { opacity: '1', transform: 'translateY(0)' }
				}
			},

			/* ========================================
			   Z-INDEX SCALE
			   ======================================== */
			zIndex: {
				'base': '0',
				'dropdown': '100',
				'sticky': '200',
				'overlay': '300',
				'modal': '400',
				'popover': '500',
				'toast': '600',
				'tooltip': '700',
				'max': '9999'
			},

			/* ========================================
			   MAX WIDTH (Container)
			   ======================================== */
			maxWidth: {
				'container-sm': '640px',
				'container-md': '768px',
				'container-lg': '1024px',
				'container-xl': '1280px',
				'container-2xl': '1536px'
			}
		}
	},
	plugins: []
};
