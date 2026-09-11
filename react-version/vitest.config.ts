import { defineConfig } from 'vitest/config';

// Kept separate from vite.config.ts so tests don't need to load the PWA plugin.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
