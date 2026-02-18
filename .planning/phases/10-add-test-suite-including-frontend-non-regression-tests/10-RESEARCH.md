# Phase 10: Add test suite including frontend non-regression tests - Research

**Researched:** 2026-02-18
**Domain:** Full-stack TypeScript testing (React frontend + Fastify backend)
**Confidence:** HIGH

## Summary

This research covers implementing a comprehensive test suite for a TypeScript full-stack application using Vite, React, Fastify, and PostgreSQL with Drizzle ORM. The standard approach in 2026 uses Vitest as the unified test runner for both frontend and backend, React Testing Library for component tests, Playwright for E2E and visual regression testing, and MSW (Mock Service Worker) for API mocking. This stack provides fast execution, excellent TypeScript support, and seamless Vite integration.

The testing strategy follows the testing pyramid: extensive unit tests for utilities and business logic, component tests for UI behavior, integration tests for API endpoints using Fastify's built-in injection method, and a focused set of E2E tests for critical user journeys. Coverage tracking uses Vitest's built-in v8 provider, which as of v3.2.0 provides Istanbul-level accuracy with superior performance.

Visual regression testing uses Playwright's built-in `toHaveScreenshot()` capability, eliminating the need for third-party snapshot services. Database testing leverages drizzle-seed for deterministic fixtures and transaction-based isolation for parallel test execution.

**Primary recommendation:** Use Vitest as the single test runner across the entire stack, leveraging its native TypeScript support, Vite integration, and compatibility with the existing build pipeline. This eliminates tool fragmentation and configuration complexity while providing 10-20x faster execution than Jest.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Full stack testing:** backend API tests + frontend component/integration tests
- **Frontend layers:** balanced mix — unit tests for utilities, component tests for UI, E2E for critical user paths
- **Backend approach:** integration tests against real test database, unit tests with mocks for business logic, contract tests for API schemas
- **Coverage target:** track metrics, aim for 80%+ without hard enforcement — report coverage to encourage improvement
- **Visual regression:** Visual snapshots for all pages + behavior tests for user interactions
- **Visual scope:** all pages/routes get visual snapshot tests
- **Snapshot updates:** auto-update in CI on approved PRs (no manual review workflow)
- **Test data:** database fixtures for E2E tests, mocked API responses for component tests — both approaches as appropriate

### Claude's Discretion
- Test framework choices (Vitest, Playwright, Jest, etc.)
- File organization and naming conventions
- Specific CI configuration details
- Which utilities get unit tests vs integration coverage
</user_constraints>

## Standard Stack

### Core Testing Infrastructure
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | ^3.2.0+ | Test runner for both frontend & backend | Native Vite integration, 10-20x faster than Jest, TypeScript-first, unified tooling across stack |
| @testing-library/react | ^16.0.0+ | Component testing utilities | Industry standard, focuses on user behavior not implementation, accessibility-first queries |
| playwright | ^1.50.0+ | E2E testing & visual regression | Built-in visual snapshots, cross-browser support, reliable auto-waiting, official Microsoft support |
| @vitest/coverage-v8 | ^3.2.0+ | Code coverage reporting | Default Vitest provider, Istanbul-level accuracy since v3.2.0, faster than instrumentation-based coverage |
| msw | ^2.8.0+ | API mocking for tests | Network-level interception, reusable across test types, no code changes needed |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/user-event | ^14.5.0+ | User interaction simulation | Component tests requiring realistic event sequences (typing, clicking, keyboard navigation) |
| @vitest/ui | ^3.2.0+ | Interactive test UI | Development workflow for debugging tests visually |
| drizzle-seed | ^0.1.0+ | Database fixture generation | Integration tests requiring realistic, deterministic test data |
| @types/node | ^22.12.0+ | Node.js type definitions | Backend test TypeScript support |

### Already Installed in Project
- `vite` (^6.1.0) - Build tool providing test transformation pipeline
- `typescript` (^5.7.3) - Type checking and compilation
- `zod` (^4.3.6) - Schema validation for contract tests

**Installation:**
```bash
# Frontend testing dependencies
cd frontend
npm install -D vitest @vitest/ui @vitest/coverage-v8 @testing-library/react @testing-library/user-event jsdom playwright msw

# Backend testing dependencies
cd backend
npm install -D vitest @vitest/ui @vitest/coverage-v8 drizzle-seed
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vitest | Jest | Jest has larger ecosystem and more community resources, but requires additional config for ESM/Vite, 10-20x slower, not optimized for TypeScript |
| Playwright | Cypress | Cypress has simpler API and better developer experience for component testing, but slower execution, less reliable in CI, requires separate tool for visual regression |
| @vitest/coverage-v8 | @vitest/coverage-istanbul | Istanbul has broader compatibility (works in non-V8 runtimes like Firefox/Bun), but requires instrumentation step, slower execution, same accuracy as v8 since Vitest v3.2.0 |
| MSW | Manual fetch mocking | Manual mocking is simpler for trivial cases, but MSW provides request-level control, reusability, and realistic network behavior simulation |

## Architecture Patterns

### Recommended Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx           # Co-located component tests
│   ├── utils/
│   │   ├── formatter.ts
│   │   └── formatter.test.ts         # Co-located unit tests
│   └── __tests__/
│       ├── setup.ts                  # Vitest setup file
│       └── mocks/
│           ├── handlers.ts           # MSW request handlers
│           └── server.ts             # MSW server setup
├── e2e/
│   ├── auth.spec.ts                  # E2E test for authentication flow
│   ├── project-management.spec.ts    # E2E test for project CRUD
│   └── visual/
│       ├── dashboard.spec.ts         # Visual regression tests
│       └── all-pages.spec.ts         # Snapshot all routes
├── vitest.config.ts                  # Vitest configuration
└── playwright.config.ts              # Playwright configuration

backend/
├── src/
│   ├── routes/
│   │   ├── projects.ts
│   │   └── projects.test.ts          # Co-located integration tests
│   ├── services/
│   │   ├── projectService.ts
│   │   └── projectService.test.ts    # Co-located unit tests
│   └── __tests__/
│       ├── setup.ts                  # Test database setup
│       └── fixtures/
│           ├── projects.ts           # drizzle-seed configurations
│           └── users.ts
├── vitest.config.ts                  # Vitest configuration
└── test.env                          # Test environment variables
```

### Pattern 1: Vitest Configuration with Vite Integration
**What:** Extend existing Vite config for test-specific settings
**When to use:** Always - leverages existing build configuration
**Example:**
```typescript
// Source: https://vitest.dev/guide/
// frontend/vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/__tests__/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/__tests__/**']
      }
    }
  })
)
```

### Pattern 2: React Testing Library Component Tests
**What:** User-centric component testing focusing on behavior not implementation
**When to use:** For all UI components, especially those with user interactions
**Example:**
```typescript
// Source: https://testing-library.com/docs/react-testing-library/intro/
// frontend/src/components/ProjectForm.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, describe } from 'vitest'
import { ProjectForm } from './ProjectForm'

describe('ProjectForm', () => {
  test('submits form with user input', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<ProjectForm onSubmit={onSubmit} />)

    // Query by label text (accessibility-first)
    await user.type(screen.getByLabelText(/project name/i), 'New Project')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(onSubmit).toHaveBeenCalledWith({ name: 'New Project' })
  })
})
```

### Pattern 3: MSW API Mocking for Component Tests
**What:** Network-level request interception without changing application code
**When to use:** Component tests that trigger API calls, integration tests
**Example:**
```typescript
// Source: https://mswjs.io/docs/getting-started
// frontend/src/__tests__/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/projects', () => {
    return HttpResponse.json([
      { id: 1, name: 'Test Project', status: 'active' }
    ])
  }),

  http.post('/api/projects', async ({ request }) => {
    const newProject = await request.json()
    return HttpResponse.json({ id: 2, ...newProject }, { status: 201 })
  })
]

// frontend/src/__tests__/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Pattern 4: Fastify HTTP Injection Testing
**What:** Test API routes using Fastify's built-in request injection (no actual HTTP)
**When to use:** Backend integration tests for route handlers
**Example:**
```typescript
// Source: https://fastify.dev/docs/latest/Guides/Testing/
// backend/src/routes/projects.test.ts
import { test, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../app' // Separated app builder function
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance

beforeAll(async () => {
  app = await build({ logger: false })
})

afterAll(async () => {
  await app.close()
})

test('GET /api/projects returns project list', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/api/projects'
  })

  expect(response.statusCode).toBe(200)
  expect(response.json()).toHaveLength(3)
})

test('POST /api/projects creates new project', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/projects',
    payload: { name: 'New Project', budget: 50000 }
  })

  expect(response.statusCode).toBe(201)
  expect(response.json()).toMatchObject({ name: 'New Project' })
})
```

### Pattern 5: Database Test Isolation with Transactions
**What:** Use PostgreSQL transactions to isolate tests without full database reset
**When to use:** Integration tests requiring database access
**Example:**
```typescript
// Source: https://blog.alexsanjoseph.com/posts/20250914-perfect-test-isolation-using-database-transactions/
// backend/src/__tests__/setup.ts
import { beforeEach, afterEach } from 'vitest'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { seed, reset } from 'drizzle-seed'
import * as schema from '../db/schema'

let testDb: ReturnType<typeof drizzle>
let testPool: Pool

beforeEach(async () => {
  testPool = new Pool({ connectionString: process.env.TEST_DATABASE_URL })
  testDb = drizzle(testPool, { schema })

  // Reset and seed database with deterministic data
  await reset(testDb, schema)
  await seed(testDb, schema, { seed: 12345, count: 10 })
})

afterEach(async () => {
  await testPool.end()
})

export { testDb }
```

### Pattern 6: Playwright Visual Regression Testing
**What:** Automated screenshot comparison for all pages/routes
**When to use:** Visual regression suite covering all application pages
**Example:**
```typescript
// Source: https://playwright.dev/docs/test-snapshots
// frontend/e2e/visual/all-pages.spec.ts
import { test, expect } from '@playwright/test'

const routes = [
  { path: '/', name: 'dashboard' },
  { path: '/projects', name: 'projects-list' },
  { path: '/projects/1', name: 'project-detail' },
  { path: '/audit', name: 'audit-view' }
]

for (const route of routes) {
  test(`${route.name} visual regression`, async ({ page }) => {
    await page.goto(route.path)

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Take full-page screenshot
    await expect(page).toHaveScreenshot(`${route.name}.png`, {
      fullPage: true,
      maxDiffPixels: 100  // Allow minor rendering differences
    })
  })
}
```

### Pattern 7: Zod Schema Contract Testing
**What:** Validate API responses match Zod schemas used for runtime validation
**When to use:** Integration tests ensuring API contracts are honored
**Example:**
```typescript
// backend/src/routes/projects.test.ts
import { test, expect } from 'vitest'
import { projectResponseSchema } from './schemas'

test('GET /api/projects returns valid schema', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/api/projects'
  })

  const data = response.json()

  // Validate response matches Zod schema
  const result = projectResponseSchema.array().safeParse(data)
  expect(result.success).toBe(true)

  if (!result.success) {
    console.error('Schema validation errors:', result.error.errors)
  }
})
```

### Anti-Patterns to Avoid
- **Testing implementation details:** Don't query by class names, internal state, or component structure - use accessible queries (role, label, text) that reflect user experience
- **Fixed delays in tests:** Replace `setTimeout` with Playwright's auto-waiting or explicit waits for conditions (`waitForLoadState`, `waitForSelector`)
- **Shared test state:** Each test should be independent - use `beforeEach` to set up clean state, never rely on test execution order
- **Fragile selectors:** Avoid CSS/XPath selectors that break with UI changes - prefer `getByRole`, `getByLabelText`, `data-testid` attributes
- **Not awaiting async operations:** Always `await` user interactions and assertions to prevent "act" warnings and flaky tests
- **Over-mocking:** Mock only what's necessary to isolate the unit under test - prefer integration tests with real dependencies when feasible

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API request mocking | Custom fetch wrapper/spy system | MSW (Mock Service Worker) | MSW intercepts at network level, works identically in tests and browser, no application code changes, handles REST and GraphQL |
| Visual regression | Screenshot comparison scripts | Playwright `toHaveScreenshot()` | Built-in pixel diffing, auto-retry until stable, cross-browser support, configurable thresholds, no external service dependencies |
| Database fixtures | Manual SQL insert scripts | drizzle-seed | Deterministic pRNG ensures consistent data, automatic relationship handling, type-safe fixture definitions, easy reset between tests |
| User interaction simulation | Manual `fireEvent` calls | @testing-library/user-event | Simulates realistic event sequences (focus, click, type), handles async properly, built-in delays match user behavior |
| Coverage reporting | Custom instrumentation | Vitest coverage (v8 provider) | Native integration, zero configuration, HTML/JSON/text reporters, excludes test files automatically, accurate as Istanbul since v3.2.0 |
| HTTP injection testing | Supertest or similar | Fastify `.inject()` | Built into Fastify, no external server needed, faster execution, ensures plugins are loaded, same API as real requests |
| Test database management | Manual schema creation/teardown | Transaction-based isolation | MVCC provides snapshot isolation, rollback cleans up automatically, enables parallel test execution, faster than truncate/recreate |

**Key insight:** The 2026 testing ecosystem has mature, battle-tested solutions for every common testing problem. Custom solutions create maintenance burden, miss edge cases (timezone handling, file uploads, animations, debouncing), lack community support, and are usually slower. The biggest anti-pattern is reinventing these wheels - modern tools handle complexity better than custom code.

## Common Pitfalls

### Pitfall 1: Not Configuring jsdom Environment for React Tests
**What goes wrong:** Tests fail with "document is not defined" or React rendering errors
**Why it happens:** Vitest defaults to Node.js environment, which lacks browser APIs (DOM, window, etc.)
**How to avoid:** Set `environment: 'jsdom'` in vitest.config.ts or use `// @vitest-environment jsdom` comment at top of test file
**Warning signs:** Errors mentioning `document`, `window`, or `ReferenceError` for browser globals

### Pitfall 2: Forgetting to Await Async Testing Library Queries
**What goes wrong:** "An update to Component inside a test was not wrapped in act(...)" warnings, flaky tests
**Why it happens:** React state updates are async, but tests proceed before updates complete
**How to avoid:** Always await `userEvent` methods (`await user.click()`), use `findBy*` queries instead of `getBy*` for elements appearing after render
**Warning signs:** `act()` warnings in console, tests passing/failing inconsistently

### Pitfall 3: Using Fake Timers Without Cleanup
**What goes wrong:** Subsequent tests hang or fail with timeout errors
**Why it happens:** `vi.useFakeTimers()` persists across tests unless explicitly cleared
**How to avoid:** Always pair `vi.useFakeTimers()` with `vi.useRealTimers()` in `afterEach`, or use scoped `vi.useFakeTimers({ shouldAdvanceTime: true })`
**Warning signs:** Tests timeout, "timer is still running" warnings, debounced functions never resolve

### Pitfall 4: Visual Snapshots on Inconsistent Environments
**What goes wrong:** Playwright visual tests fail in CI with pixel differences despite passing locally
**Why it happens:** Browser rendering varies by OS, hardware, fonts, power settings (battery vs. plugged in)
**How to avoid:** Generate baseline screenshots in the same environment as CI (use Docker locally or GitHub Actions), configure `maxDiffPixels` threshold for minor variations, use `stylePath` to hide dynamic content (timestamps, user avatars)
**Warning signs:** Visual diffs showing font rendering differences, anti-aliasing variations, color shifts

### Pitfall 5: Not Isolating Database Tests
**What goes wrong:** Tests fail when run in parallel or in different order, "duplicate key" errors
**Why it happens:** Tests share database state, rely on specific data existing, or create conflicting records
**How to avoid:** Use transaction-based isolation (rollback after each test), drizzle-seed with deterministic seeds, separate test database from development, never commit transactions in test code
**Warning signs:** Tests pass individually but fail in suite, order-dependent failures, unique constraint violations

### Pitfall 6: Testing UI Library Components Instead of Application Logic
**What goes wrong:** Tests break when shadcn/ui or Radix components update, excessive test maintenance
**Why it happens:** Tests query internal structure of third-party components (dropdown menus, dialogs, tabs)
**How to avoid:** Test application behavior not library internals - verify data renders correctly, user actions trigger expected outcomes, avoid testing that dropdown component opens/closes (library's responsibility)
**Warning signs:** Tests break after dependency updates, testing dialog animations or focus management, querying by library-specific class names

### Pitfall 7: Over-Reliance on `data-testid` Selectors
**What goes wrong:** Tests don't catch accessibility issues, verbose test setup adding IDs everywhere
**Why it happens:** `data-testid` is easiest selector but doesn't reflect user experience
**How to avoid:** Prefer semantic queries - `getByRole`, `getByLabelText`, `getByText` - use `data-testid` only for truly ambiguous elements, improve component accessibility rather than adding test IDs
**Warning signs:** Every element has `data-testid`, tests pass but users with screen readers struggle

### Pitfall 8: Not Mocking External API Calls in Component Tests
**What goes wrong:** Tests make real HTTP requests, slow execution, flaky failures on network issues
**Why it happens:** Forgot to set up MSW handlers, handler patterns don't match actual request URLs
**How to avoid:** Set up MSW server in test setup file, define handlers for all API endpoints used by components, use `server.listen({ onUnhandledRequest: 'error' })` to catch unhandled requests
**Warning signs:** Tests take >1s to run, occasional ECONNREFUSED errors, tests fail without internet connection

### Pitfall 9: Snapshot Updates Without Review
**What goes wrong:** Visual regressions get committed as "correct" baseline, bugs slip through
**Why it happens:** Running `--update-snapshots` without inspecting changes, auto-update in CI without human verification
**How to avoid:** Always review snapshot diffs before updating, require manual approval for visual changes in PR process, auto-update only after PR approval (not on every CI run)
**Warning signs:** Visual bugs discovered in production, large snapshot updates without corresponding code changes

### Pitfall 10: Not Testing Error States and Loading States
**What goes wrong:** Application breaks when API fails or data loads slowly, poor user experience
**Why it happens:** Tests only cover "happy path" scenarios with immediate successful responses
**How to avoid:** Use MSW to simulate error responses (500, 404, network errors), test loading states by delaying responses, verify error messages display correctly, test retry mechanisms
**Warning signs:** No tests for error handlers, loading spinners never tested, no network error handling

## Code Examples

Verified patterns from official sources:

### Backend: Testing Fastify Routes with Real Database
```typescript
// Source: https://fastify.dev/docs/latest/Guides/Testing/
// backend/src/routes/projects.test.ts
import { test, expect, describe, beforeAll, afterAll, beforeEach } from 'vitest'
import { build } from '../app'
import { seed, reset } from 'drizzle-seed'
import type { FastifyInstance } from 'fastify'
import * as schema from '../db/schema'

let app: FastifyInstance

beforeAll(async () => {
  app = await build({
    logger: false,
    databaseUrl: process.env.TEST_DATABASE_URL
  })
})

beforeEach(async () => {
  const db = app.db // Access Drizzle instance from app
  await reset(db, schema)
  await seed(db, schema, { seed: 12345 })
})

afterAll(async () => {
  await app.close()
})

describe('Project API', () => {
  test('GET /api/projects returns seeded projects', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/projects'
    })

    expect(response.statusCode).toBe(200)
    const projects = response.json()
    expect(projects).toHaveLength(10) // drizzle-seed default count
  })

  test('POST /api/projects validates schema', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects',
      payload: { name: '' } // Invalid: empty name
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toHaveProperty('error')
  })
})
```

### Frontend: Component Test with MSW and User Interaction
```typescript
// Source: https://testing-library.com/docs/react-testing-library/intro/
// frontend/src/components/ProjectList.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, describe } from 'vitest'
import { ProjectList } from './ProjectList'
import { server } from '../__tests__/mocks/server'
import { http, HttpResponse } from 'msw'

describe('ProjectList', () => {
  test('loads and displays projects', async () => {
    render(<ProjectList />)

    // Loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })
  })

  test('handles API error gracefully', async () => {
    // Override handler to return error
    server.use(
      http.get('/api/projects', () => {
        return HttpResponse.json(
          { error: 'Database unavailable' },
          { status: 500 }
        )
      })
    )

    render(<ProjectList />)

    await waitFor(() => {
      expect(screen.getByText(/error loading projects/i)).toBeInTheDocument()
    })
  })

  test('filters projects by search term', async () => {
    const user = userEvent.setup()
    render(<ProjectList />)

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    const searchInput = screen.getByRole('searchbox', { name: /search projects/i })
    await user.type(searchInput, 'Alpha')

    expect(screen.queryByText('Test Project')).not.toBeInTheDocument()
    expect(screen.getByText('Project Alpha')).toBeInTheDocument()
  })
})
```

### E2E: Playwright Critical User Journey
```typescript
// Source: https://playwright.dev/docs/intro
// frontend/e2e/project-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Project Management Flow', () => {
  test('user can create, edit, and delete project', async ({ page }) => {
    // Navigate to projects page
    await page.goto('/projects')

    // Create new project
    await page.getByRole('button', { name: /new project/i }).click()
    await page.getByLabel(/project name/i).fill('E2E Test Project')
    await page.getByLabel(/budget/i).fill('100000')
    await page.getByRole('button', { name: /save/i }).click()

    // Verify project appears in list
    await expect(page.getByText('E2E Test Project')).toBeVisible()

    // Edit project
    await page.getByRole('row', { name: /e2e test project/i })
      .getByRole('button', { name: /edit/i }).click()
    await page.getByLabel(/budget/i).fill('150000')
    await page.getByRole('button', { name: /save/i }).click()

    // Verify update
    await expect(page.getByText('€150,000')).toBeVisible()

    // Delete project
    await page.getByRole('row', { name: /e2e test project/i })
      .getByRole('button', { name: /delete/i }).click()
    await page.getByRole('button', { name: /confirm/i }).click()

    // Verify deletion
    await expect(page.getByText('E2E Test Project')).not.toBeVisible()
  })
})
```

### Coverage Configuration
```typescript
// Source: https://vitest.dev/guide/coverage.html
// vitest.config.ts (shared pattern)
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/__tests__/**',
        'src/**/*.d.ts',
        'src/**/types.ts'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      },
      // Report coverage but don't fail CI for threshold misses
      skipFull: false,
      all: true
    }
  }
})
```

### Playwright Configuration with Visual Testing
```typescript
// Source: https://playwright.dev/docs/test-snapshots
// frontend/playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'https://portfolio.dm.eurostar.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  // Visual regression configuration
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
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'visual-regression',
      testDir: './e2e/visual',
      use: { ...devices['Desktop Chrome'] }
    }
  ],

  webServer: {
    command: 'npm run dev',
    url: 'https://portfolio.dm.eurostar.com',
    reuseExistingServer: !process.env.CI,
    ignoreHTTPSErrors: true
  }
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest + ts-jest | Vitest native TypeScript | 2023 (Vitest 1.0) | 10-20x faster test execution, no transform config needed, unified with Vite build pipeline |
| Istanbul coverage only | V8 coverage with AST remapping | 2024 (Vitest 3.2.0) | V8 now has Istanbul-level accuracy without instrumentation overhead, faster coverage collection |
| Enzyme shallow rendering | React Testing Library | 2020 (RTL mainstream adoption) | Tests focus on user behavior not implementation, more resilient to refactoring, accessibility-first |
| Percy/Chromatic for visual regression | Playwright built-in snapshots | 2022 (Playwright 1.20+) | No external service dependency, faster feedback, works offline, built into test runner |
| Separate mock libraries (nock, jest-fetch-mock) | MSW (Mock Service Worker) | 2021 (MSW 1.0) | Single solution for all API mocking, works identically in browser and Node, network-level interception |
| Manual database fixtures | drizzle-seed deterministic generation | 2024 (drizzle-seed release) | Reproducible test data, eliminates fixture maintenance, type-safe fixture definitions |
| c8 coverage provider | @vitest/coverage-v8 | 2023 (Vitest native providers) | Better integration, more accurate source maps, built-in to Vitest ecosystem |

**Deprecated/outdated:**
- **Supertest with Fastify:** Fastify's built-in `.inject()` is faster and doesn't require starting a server - use injection for integration tests
- **@testing-library/react-hooks:** Deprecated since React 18 - use `renderHook` from @testing-library/react instead
- **jest.mock() patterns:** In Vitest, use `vi.mock()` with identical API, or leverage MSW for API mocking (cleaner separation)
- **Manual `act()` wrapping:** Modern React Testing Library handles `act()` automatically - only needed for raw ReactDOM operations
- **waitForElement:** Deprecated - use `findBy*` queries which have built-in async waiting
- **cleanup after each test:** No longer needed - React Testing Library auto-cleans up after each test since v9

## Open Questions

1. **CI/CD snapshot update automation**
   - What we know: User wants auto-update in CI on approved PRs
   - What's unclear: Exact GitHub Actions workflow to update snapshots post-merge vs. pre-merge
   - Recommendation: Use Playwright's `--update-snapshots` in CI only after PR approval, commit updated snapshots in separate automated commit, requires GitHub Actions workflow with proper permissions

2. **Visual regression scope for dynamic content**
   - What we know: All pages/routes get visual snapshots
   - What's unclear: How to handle pages with user-specific data, timestamps, real-time updates
   - Recommendation: Use Playwright's `stylePath` option to hide dynamic elements (CSS to set `visibility: hidden` on timestamps, avatars), mock API responses to return deterministic data, consider separate visual tests for stable marketing pages vs. behavior tests for dynamic dashboards

3. **Test database provisioning in CI**
   - What we know: Integration tests run against real PostgreSQL test database
   - What's unclear: How to provision/configure test database in CI environment (GitHub Actions)
   - Recommendation: Use GitHub Actions services to run PostgreSQL container, run Drizzle migrations in CI before tests, use `TEST_DATABASE_URL` environment variable, teardown after test suite completes

4. **Coverage enforcement vs. encouragement**
   - What we know: 80%+ target without hard enforcement
   - What's unclear: Should CI fail on coverage drop or just report?
   - Recommendation: Configure Vitest thresholds at 80% but don't fail builds (comment-only reporting), use GitHub Actions to post coverage report as PR comment, track coverage trends over time, consider gradual increase strategy

## Sources

### Primary (HIGH confidence)
- [Vitest Official Guide](https://vitest.dev/guide/) - Test runner features, configuration, coverage
- [Vitest Coverage Documentation](https://vitest.dev/guide/coverage.html) - v8 vs Istanbul providers, configuration
- [Playwright Visual Snapshots](https://playwright.dev/docs/test-snapshots) - Screenshot testing, configuration, update workflow
- [React Testing Library Introduction](https://testing-library.com/docs/react-testing-library/intro/) - Philosophy, best practices, query patterns
- [Fastify Testing Guide](https://fastify.dev/docs/latest/Guides/Testing/) - HTTP injection, test patterns, plugin testing
- [MSW Getting Started](https://mswjs.io/docs/getting-started) - Network mocking, Node.js setup, handler patterns
- [Drizzle-seed Overview](https://orm.drizzle.team/docs/seed-overview) - Deterministic data generation, database reset strategies

### Secondary (MEDIUM confidence)
- [Vitest React TypeScript Best Practices 2026](https://oneuptime.com/blog/post/2026-01-15-unit-test-react-vitest-testing-library/view) - Testing strategy, setup patterns
- [Playwright Visual Testing 2026](https://oneuptime.com/blog/post/2026-01-27-playwright-visual-testing/view) - Visual regression implementation
- [Testing in 2026: Full Stack Testing Strategies](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies) - Testing pyramid, framework comparison
- [Playwright CI/CD Integration with GitHub Actions](https://www.techlistic.com/2026/02/playwright-cicd-integration-with-github.html) - CI setup, automation patterns
- [Mock Database in Tests with Drizzle and Playwright Fixtures](https://mainmatter.com/blog/2025/08/21/mock-database-in-svelte-tests/) - Database testing patterns
- [Perfect Test Isolation Using Database Transactions](https://blog.alexsanjoseph.com/posts/20250914-perfect-test-isolation-using-database-transactions/) - Transaction-based isolation pattern
- [SQL Isolation Levels](https://dev.solita.fi/2026/02/13/postgresql-isolation-levels.html) - PostgreSQL transaction isolation

### Tertiary (LOW confidence - patterns established but not 2026-specific)
- [React Testing Library + Vitest Common Mistakes](https://medium.com/@samueldeveloper/react-testing-library-vitest-the-mistakes-that-haunt-developers-and-how-to-fight-them-like-ca0a0cda2ef8) - Anti-patterns and pitfalls
- [Kent C. Dodds: Common Mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) - Testing best practices
- [Playwright Flaky Tests Best Practices](https://www.browserstack.com/guide/playwright-flaky-tests) - Selector strategies, stability patterns
- [Playwright Selectors Best Practices 2026](https://www.browserstack.com/guide/playwright-selectors-best-practices) - Role-based selectors, stable targeting
- [Testing Fastify with Node Test Runner](https://nearform.com/insights/writing-tests-with-fastify-and-node-test-runner/) - Alternative to Vitest for backend

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official documentation verified, 2026 sources confirm current usage, Vitest already partially installed in project
- Architecture: HIGH - Patterns sourced from official docs (Vitest, Playwright, RTL, Fastify), verified code examples
- Pitfalls: MEDIUM - Based on community sources and practical experience articles, common patterns but not always officially documented
- CI/CD integration: MEDIUM - GitHub Actions patterns well-established, but snapshot update workflow needs project-specific implementation

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (30 days - stable ecosystem with infrequent breaking changes)
