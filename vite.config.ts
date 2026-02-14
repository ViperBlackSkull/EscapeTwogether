import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		// Enable minification
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true
			}
		},
		// Split chunks for better caching
		rollupOptions: {
			output: {
				manualChunks: {
					// Vendor chunks
					'pixi': ['pixi.js'],
					'socket': ['socket.io-client'],
					'svelte-vendor': ['svelte', 'svelte/transition', 'svelte/animate', 'svelte/motion']
				}
			}
		},
		// Target modern browsers for smaller bundles
		target: 'es2020',
		// Enable source maps for debugging (disable in production if needed)
		sourcemap: false
	},
	// Optimize dependencies
	optimizeDeps: {
		include: ['pixi.js', 'socket.io-client'],
		exclude: []
	},
	// Enable gzip compression preview
	server: {
		host: true,
		port: 5173
	},
	// Preview server settings
	preview: {
		host: true,
		port: 4173
	}
});
