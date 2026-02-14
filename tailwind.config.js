/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				'deep-navy': '#1a1a2e',
				'soft-black': '#0f0f1a',
				'dusty-rose': '#c9a9a6',
				'antique-gold': '#8b7355',
				'warm-amber': '#f4a460',
				'soft-teal': '#4a9b8c'
			},
			fontFamily: {
				display: ['Playfair Display', 'serif'],
				body: ['Lato', 'sans-serif']
			}
		}
	},
	plugins: []
};
