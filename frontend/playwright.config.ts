import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],

  use: {
    // Base URL for the application
    baseURL: 'http://localhost:5173',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on retry
    video: 'on-first-retry'
  },

  // Visual regression settings
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
      animations: 'disabled'
    }
  },

  projects: [
    {
      name: 'chromium',
      testDir: './e2e',
      testIgnore: '**/visual/**',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'visual-regression',
      testDir: './e2e/visual',
      use: {
        ...devices['Desktop Chrome'],
        // Inject CSS to hide dynamic content
        stylePath: './e2e/visual/hide-dynamic.css'
      }
    }
  ],

  // Start dev server before tests
  // Note: Frontend requires backend API - assumes backend is already running on localhost:3000
  // with DEV_MODE=true. Start backend separately with: cd ../backend && npm run dev
  webServer: {
    command: 'npx vite --config vite.config.e2e.ts',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
})
