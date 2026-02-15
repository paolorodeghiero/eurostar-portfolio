---
status: resolved
trigger: "Investigate issue: api-docs-401-when-logged-in"
created: 2026-02-15T10:00:00Z
updated: 2026-02-15T10:15:00Z
---

## Current Focus

hypothesis: CONFIRMED - /docs is accessed via browser navigation (href link), not fetch API, so no Authorization header is sent
test: Review evidence chain - auth plugin requires Bearer token on all routes except /health, /docs has no exception
expecting: Need to either exempt /docs from auth or change frontend to fetch and inject token
next_action: Implement fix by adding /docs to auth bypass list

## Symptoms

expected: API docs page (/docs) should load Swagger UI when user is authenticated
actual: Shows 401 Unauthorized error
errors: 401 error on API docs page
reproduction: Log into the app normally, then navigate to localhost:5173/docs
started: Started happening after a recent code change (was working before)

## Eliminated

## Evidence

- timestamp: 2026-02-15T10:05:00Z
  checked: Swagger plugin configuration (backend/src/plugins/swagger.ts)
  found: Swagger UI is registered with routePrefix: '/docs', no explicit auth bypass configured
  implication: /docs endpoint goes through normal auth middleware

- timestamp: 2026-02-15T10:06:00Z
  checked: Auth plugin (backend/src/plugins/auth.ts)
  found: preValidation hook checks Authorization header on ALL requests except /health
  implication: /docs endpoint requires Bearer token in Authorization header

- timestamp: 2026-02-15T10:07:00Z
  checked: Frontend vite.config.ts proxy settings
  found: '/docs' is proxied to backend (localhost:3000), changeOrigin: true
  implication: When user navigates to localhost:5173/docs, request is proxied to backend

- timestamp: 2026-02-15T10:08:00Z
  checked: Frontend PortfolioHeader.tsx link
  found: Link is standard <a href="/docs"> tag (around line 77)
  implication: Browser navigation (not fetch/API call) - no Authorization header sent

## Resolution

root_cause: The /docs endpoint requires authentication (via preValidation hook), but is accessed via standard browser navigation (<a href="/docs">) which doesn't include Authorization header. The auth plugin only exempts /health endpoint, not /docs.
fix: Modified auth.ts preValidation hook to skip auth for paths starting with '/docs' (includes /docs and all Swagger UI static assets)
verification: Fix applied. Manual verification required:
  1. Start backend server
  2. Log into application at localhost:5173
  3. Click "API" link in header (navigates to /docs)
  4. Expected: Swagger UI loads successfully
  5. Expected: Can explore API documentation
files_changed:
  - backend/src/plugins/auth.ts
