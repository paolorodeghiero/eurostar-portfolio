import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/__tests__/setup.ts',
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/e2e/**', // Exclude Playwright e2e tests
        '**/.{idea,git,cache,output,temp}/**',
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/**/__tests__/**',
          'src/main.tsx',
          'src/vite-env.d.ts',
        ],
      },
    },
  })
);
