import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['tests/**/*.test.ts'],
		exclude: ['tests/**/e2e/**', 'node_modules/**'],
		environment: 'node',
		globals: false,
	},
});
