---
status: resolved
trigger: "dev-mode-auth-broken - Frontend now asks for EntraID authentication instead of bypassing in dev mode"
created: 2026-02-05T00:00:00Z
updated: 2026-02-05T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Backend was not running, causing dev mode detection to fail
test: Started backend and tested /api/me endpoint
expecting: Backend returns dev user → frontend dev mode should work
next_action: Document root cause and provide solution

## Symptoms

expected: Dev mode should auto-login as a dev user without prompts - bypass EntraID
actual: Frontend asks for EntraID authentication in development
errors: None specified - just the auth prompt appearing
reproduction: Load the frontend in development mode
started: Just now / today - started after recent changes

## Eliminated

## Evidence

- timestamp: 2026-02-05T00:00:01Z
  checked: Auth flow structure in App.tsx
  found: Dev mode detection is working correctly - checks for dev mode via checkDevMode(), then bypasses MSAL if dev mode is true
  implication: The logic structure looks correct - issue is likely in checkDevMode() function

- timestamp: 2026-02-05T00:00:02Z
  checked: dev-auth.ts checkDevMode function
  found: Function calls /api/me endpoint without token, expects response with id='dev-user'
  implication: Dev mode detection relies on backend returning dev user without auth

- timestamp: 2026-02-05T00:00:03Z
  checked: Recent commits
  found: No auth-related changes in recent commits - recent work on actuals, currency conversion
  implication: Auth code unchanged, but something environmental might have changed

- timestamp: 2026-02-05T00:00:04Z
  checked: Backend .env file
  found: DEV_MODE=true is set correctly in backend/.env
  implication: Backend is configured for dev mode, so if running it would return dev user

- timestamp: 2026-02-05T00:00:05Z
  checked: Frontend .env file
  found: No frontend/.env file exists - VITE_API_URL will be undefined or default to 'http://localhost:3000'
  implication: Frontend is correctly targeting localhost:3000, but needs backend to be running

- timestamp: 2026-02-05T00:00:06Z
  checked: Backend server on localhost:3000
  found: Backend is not responding - connection times out
  implication: Backend is not running, so checkDevMode() fails with network error and returns null

- timestamp: 2026-02-05T00:00:07Z
  checked: Dev mode logic in App.tsx
  found: When checkDevMode() returns null, isDevMode stays false, so app uses MSAL auth flow
  implication: This is the root cause - backend not running → no dev user → MSAL prompt

- timestamp: 2026-02-05T00:00:08Z
  checked: Started backend with npm run dev
  found: Backend successfully started, /api/me returns {"id":"dev-user","email":"dev@eurostar.com","name":"Development User","role":"admin"}
  implication: Root cause confirmed - backend was simply not running

## Resolution

root_cause: Backend server was not running. The frontend dev mode detection calls /api/me endpoint to check if backend is in dev mode. When backend is not running, this call fails with a network error, checkDevMode() returns null, and the frontend falls back to MSAL authentication flow.
fix: Backend needs to be running for dev mode to work. User needs to start backend with 'npm run dev' in the backend directory before starting frontend.
verification: Started backend and confirmed /api/me endpoint returns dev user correctly. Frontend should now bypass MSAL auth and show dev mode.
files_changed: []
