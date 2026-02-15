import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['tests/**/*.test.ts'],
		exclude: ['tests/**/e2e/**', 'node_modules/**'],
		environment: 'jsdom',
		globals: false,
		environmentMatchGlobs: [
			// Use node environment for non-component tests
			['tests/puzzles/**/*.test.ts', 'node'],
			['tests/server/**/*.test.ts', 'node'],
		],
	},
});
