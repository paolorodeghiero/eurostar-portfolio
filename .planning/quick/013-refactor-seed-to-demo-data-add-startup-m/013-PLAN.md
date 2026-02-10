---
phase: quick
plan: 013
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/db/demo-data.ts
  - backend/src/db/seed.ts
  - backend/src/db/init.ts
  - backend/src/server.ts
  - backend/package.json
  - Makefile
autonomous: true

must_haves:
  truths:
    - "Demo data script creates rich testable sample data"
    - "Backend runs migrations at startup and fails if they fail"
    - "Minimal seed runs after migration if database is empty"
    - "Makefile commands reflect new naming"
  artifacts:
    - path: "backend/src/db/demo-data.ts"
      provides: "Rich demo data creation script (renamed from seed.ts)"
      min_lines: 400
    - path: "backend/src/db/seed.ts"
      provides: "Minimal startup seed for essential referentials"
      min_lines: 30
    - path: "backend/src/db/init.ts"
      provides: "Startup initialization with migration and minimal seed"
      exports: ["runStartupInit"]
  key_links:
    - from: "backend/src/server.ts"
      to: "backend/src/db/init.ts"
      via: "runStartupInit() call at startup"
      pattern: "runStartupInit"
    - from: "backend/package.json"
      to: "backend/src/db/demo-data.ts"
      via: "db:demo-data script"
      pattern: "db:demo-data.*demo-data\\.ts"
---

<objective>
Refactor seed/demo-data naming and add startup initialization.

Purpose: Clarify distinction between demo data (testable sample data) and minimal seed (essential referentials), and ensure the database is properly initialized on backend startup.

Output: Renamed demo-data script, new minimal seed, startup migration/init logic, updated Makefile.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@backend/src/db/seed.ts
@backend/src/db/init.ts
@backend/src/server.ts
@backend/package.json
@Makefile
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rename seed to demo-data and create minimal seed</name>
  <files>backend/src/db/demo-data.ts, backend/src/db/seed.ts</files>
  <action>
1. Rename `backend/src/db/seed.ts` to `backend/src/db/demo-data.ts`:
   - Keep all existing content (departments, teams, projects, etc.)
   - Rename the main function from `seed()` to `createDemoData()`
   - Update console logs from "Seeding database" to "Creating demo data"
   - Update final success message

2. Create new minimal `backend/src/db/seed.ts`:
   - Purpose: Ensure essential referentials exist for the app to function
   - Essential referentials (if empty):
     - Committee thresholds (required for committee level calculation)
     - Cost T-shirt thresholds (required for budget sizing display)
     - Project ID counter for current year (required for new project creation)
   - Use upsert pattern (onConflictDoNothing) to avoid duplicates
   - Export `seedEssentialData()` function for use in init.ts
   - Only seed if these tables are empty (check count first)
   - System statuses already handled by ensureSystemStatuses(), do NOT duplicate
  </action>
  <verify>Files exist at correct paths: `ls backend/src/db/demo-data.ts backend/src/db/seed.ts`</verify>
  <done>demo-data.ts contains full demo data creation, seed.ts contains minimal essential referentials</done>
</task>

<task type="auto">
  <name>Task 2: Add startup migration and initialization to init.ts</name>
  <files>backend/src/db/init.ts, backend/src/server.ts</files>
  <action>
1. Update `backend/src/db/init.ts`:
   - Import `seedEssentialData` from seed.ts
   - Add `runMigrations()` function that executes `drizzle-kit push --force`:
     - Use child_process.execSync or similar
     - Log "Running database migrations..."
     - If migration fails (non-zero exit), log error and call process.exit(1)
     - If successful, log "Migrations complete"
   - Create `runStartupInit()` function that:
     1. Calls runMigrations()
     2. Calls ensureSystemStatuses() (existing)
     3. Calls seedEssentialData()
   - Export runStartupInit

2. Update `backend/src/server.ts`:
   - Replace `import { ensureSystemStatuses }` with `import { runStartupInit }`
   - Replace `await ensureSystemStatuses()` with `await runStartupInit()`
   - This runs migrations, system statuses, and essential seed at startup
  </action>
  <verify>TypeScript compiles: `cd backend && npx tsc --noEmit`</verify>
  <done>Backend startup runs migrations then seeds essential data, terminates on migration failure</done>
</task>

<task type="auto">
  <name>Task 3: Update package.json scripts and Makefile</name>
  <files>backend/package.json, Makefile</files>
  <action>
1. Update `backend/package.json` scripts:
   - Change `"db:seed": "tsx src/db/seed.ts"` to `"db:demo-data": "tsx src/db/demo-data.ts"`
   - Keep db:reset, db:push, db:generate unchanged

2. Update `Makefile`:
   - Rename `db-seed` target to `db-demo-data`
   - Update help text: "make db-demo-data - Load demo data (departments, projects, etc.)"
   - Update `db-fresh` to use `db:demo-data` instead of `db:seed`
   - Update help text for db-fresh: "Full reset: push schema + truncate + demo data"
  </action>
  <verify>Run `make help` shows updated commands; `cd backend && npm run` lists db:demo-data</verify>
  <done>All scripts and Makefile commands use new naming convention</done>
</task>

</tasks>

<verification>
1. `ls backend/src/db/demo-data.ts backend/src/db/seed.ts` - both files exist
2. `cd backend && npx tsc --noEmit` - TypeScript compiles without errors
3. `make help` - shows db-demo-data instead of db-seed
4. `grep "db:demo-data" backend/package.json` - script exists
5. Backend starts without error: `cd backend && npm run dev` (test manually if needed)
</verification>

<success_criteria>
- demo-data.ts contains full sample data creation (renamed from seed.ts)
- seed.ts contains minimal essential referentials only
- Backend runs drizzle-kit push at startup, terminates if migration fails
- Backend seeds essential data after successful migration
- Makefile uses db-demo-data naming
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/quick/013-refactor-seed-to-demo-data-add-startup-m/013-SUMMARY.md`
</output>
