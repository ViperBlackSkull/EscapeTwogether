import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		// Use esbuild minification (built-in, faster than terser)
		minify: 'esbuild',
		// Target modern browsers for smaller bundles
		target: 'es2020',
		// Disable source maps for production
		sourcemap: false,
		// Report compressed size
		reportCompressedSize: true,
		// Chunk size warning limit
		chunkSizeWarningLimit: 500
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
