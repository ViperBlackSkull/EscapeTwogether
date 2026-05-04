import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '../../../shared/types/puzzle.js': path.resolve(__dirname, '../shared/types/puzzle.ts'),
      '../../../shared/types/gameFlow.js': path.resolve(__dirname, '../shared/types/gameFlow.ts'),
      '../../../shared/types/narrative.js': path.resolve(__dirname, '../shared/types/narrative.ts'),
      '../../../shared/types/hint.js': path.resolve(__dirname, '../shared/types/hint.ts'),
      '../../../shared/types/scenario.js': path.resolve(__dirname, '../shared/types/scenario.ts'),
      '../../../shared/types/scoring.js': path.resolve(__dirname, '../shared/types/scoring.ts'),
      '../../shared/types/gameFlow.js': path.resolve(__dirname, '../shared/types/gameFlow.ts'),
      '../../shared/types/narrative.js': path.resolve(__dirname, '../shared/types/narrative.ts'),
      '../../shared/types/puzzle.js': path.resolve(__dirname, '../shared/types/puzzle.ts'),
      '../../shared/types/scoring.js': path.resolve(__dirname, '../shared/types/scoring.ts'),
    },
  },
});
