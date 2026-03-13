import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: './src/__tests__/setup.ts',
    globalSetup: './src/__tests__/global-setup.ts',
    testTimeout: 10000,

    // Worker configuration for database isolation (Vitest 4 syntax)
    maxWorkers: 4,
    minWorkers: 1,

    env: {
      // Set test environment variables before modules load
      DEV_MODE: 'true',
      TEST_DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/eurostar_portfolio_test',
    },

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        'src/types/**',
        'src/db/migrations/**',
        'src/server.ts',
      ],
    },
  },
});
