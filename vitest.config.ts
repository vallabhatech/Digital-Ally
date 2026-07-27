import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src').replace(/\\/g, '/') },
      {
        find: '@google/genai',
        replacement: path
          .resolve(__dirname, './node_modules/@google/genai/dist/node/index.cjs')
          .replace(/\\/g, '/'),
      },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    server: {
      deps: {
        inline: ['@google/genai'],
      },
    },
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'server/**/*.test.js'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 80,
        branches: 50,
        functions: 75,
        lines: 80,
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        'src/test/**',
        'src/shared/constants.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        'playwright.config.ts',
        'vite.config.ts',
        'vitest.config.ts',
      ],
    },
  },
});
