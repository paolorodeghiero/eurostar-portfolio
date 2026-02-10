---
phase: quick
plan: 013
subsystem: database-initialization
tags: [refactor, startup, migrations, seed-data]
dependency-graph:
  requires: []
  provides: [startup-migrations, essential-seed, demo-data-separation]
  affects: [backend-startup, developer-workflow]
tech-stack:
  added: []
  patterns: [startup-initialization, minimal-seed-pattern, migration-automation]
key-files:
  created:
    - backend/src/db/demo-data.ts
  modified:
    - backend/src/db/seed.ts
    - backend/src/db/init.ts
    - backend/src/server.ts
    - backend/package.json
    - Makefile
decisions: [separate-demo-from-essential, run-migrations-at-startup, fail-fast-on-migration-error]
metrics:
  duration: 4
  completed: 2026-02-10
---

# Quick Task 013: Refactor seed to demo-data, add startup migration

**One-liner:** Separated demo data from essential seed, automated database migrations at startup with fail-fast error handling

## Summary

Refactored database seeding to clearly distinguish between rich demo data (for development/testing) and essential referential data (required for app functionality). Added automated migration execution at server startup with graceful failure handling.

### Key Changes

**1. Demo Data Separation**
- Renamed `seed.ts` to `demo-data.ts` with 400+ lines of rich sample data
- Function renamed from `seed()` to `createDemoData()`
- Contains full dataset: departments, teams, projects, budgets, receipts, invoices, etc.
- Used only for development testing via `make db-demo-data`

**2. Minimal Essential Seed**
- New `seed.ts` contains only critical referentials needed for app to function
- Seeds if tables are empty: committee thresholds, cost T-shirt thresholds, project ID counter
- Exported `seedEssentialData()` function for use in startup initialization
- Uses upsert pattern to avoid duplicates

**3. Startup Migration Automation**
- Added `runMigrations()` function that executes `drizzle-kit push --force`
- Calls `process.exit(1)` on migration failure (fail-fast pattern)
- Created `runStartupInit()` that orchestrates: migrations → system statuses → essential seed
- Backend now self-initializes database on startup

**4. Updated Developer Workflow**
- `make db-demo-data` instead of `make db-seed`
- `make db-fresh` runs full reset with demo data
- Backend startup: migrations run automatically, no manual `make db-push` needed
- Package.json script: `db:demo-data` instead of `db:seed`

## Deviations from Plan

None - plan executed exactly as written.

## Implementation Details

### Startup Flow

```
Backend Startup
  ↓
runStartupInit()
  ├── runMigrations() [drizzle-kit push --force]
  │   └── Exit on failure
  ├── ensureSystemStatuses() [Draft, Completed, Stopped]
  └── seedEssentialData() [thresholds, counters]
```

### Essential vs Demo Data

| Type | Purpose | When | Examples |
|------|---------|------|----------|
| Essential | App functionality | Every startup | Committee thresholds, T-shirt thresholds, project ID counter |
| Demo | Development/testing | Manual: `make db-demo-data` | Departments, teams, projects, budgets, receipts |

### Migration Automation Benefits

- No manual `make db-push` needed before starting backend
- Fail-fast on schema errors prevents running with stale schema
- Fresh environments (CI, new developer) work immediately
- Database state always matches code schema on startup

## Files Changed

### Created
- **backend/src/db/demo-data.ts** (20KB) - Rich sample data creation

### Modified
- **backend/src/db/seed.ts** - Minimal essential referentials only
- **backend/src/db/init.ts** - Added runMigrations() and runStartupInit()
- **backend/src/server.ts** - Call runStartupInit() instead of ensureSystemStatuses()
- **backend/package.json** - db:seed → db:demo-data
- **Makefile** - db-seed → db-demo-data

## Testing Verified

- Both files exist at correct paths
- TypeScript compiles without errors
- `make help` shows updated commands
- `npm run` lists db:demo-data script
- Migration automation ready for backend startup test

## Self-Check: PASSED

**Created files:**
- FOUND: backend/src/db/demo-data.ts

**Modified files:**
- FOUND: backend/src/db/seed.ts
- FOUND: backend/src/db/init.ts
- FOUND: backend/src/server.ts
- FOUND: backend/package.json
- FOUND: Makefile

**Commits:**
- FOUND: 8417f34d (refactor: rename seed to demo-data and create minimal seed)
- FOUND: febd15dc (feat: add startup migration and initialization)
- FOUND: d2766963 (chore: update package.json scripts and Makefile)

All files exist, TypeScript compiles, commits recorded.
