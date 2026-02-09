---
phase: quick-005
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - Makefile
autonomous: true

must_haves:
  truths:
    - "User can run `make dev` to start both servers concurrently"
    - "User can run `make db-reset` to fully reset and seed database"
    - "User can run `make db-seed` to seed the database"
  artifacts:
    - path: "Makefile"
      provides: "Project-wide make commands"
      contains: "dev db-reset db-seed"
  key_links:
    - from: "Makefile"
      to: "backend/package.json"
      via: "npm run commands"
    - from: "Makefile"
      to: "frontend/package.json"
      via: "npm run dev"
---

<objective>
Create a root-level Makefile with three commands for common development tasks.

Purpose: Simplify developer workflow with single-command operations for running dev servers and managing database state.
Output: Root Makefile with `make dev`, `make db-reset`, and `make db-seed` commands.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@backend/package.json
@frontend/package.json
@docker-compose.yml
@backend/drizzle/0008_audit_trigger.sql
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create root Makefile with dev, db-reset, and db-seed commands</name>
  <files>Makefile</files>
  <action>
Create a Makefile at the project root with exactly three targets:

1. **`make dev`** - Start both backend and frontend dev servers concurrently:
   - Use `&` to background the backend process, then run frontend in foreground
   - Or use `make -j2` with separate targets
   - The simplest approach: `cd backend && npm run dev & cd frontend && npm run dev`
   - Include a trap to kill background processes on Ctrl+C

2. **`make db-reset`** - Full database reset with audit trigger:
   - Run drizzle-kit push with --force flag to reset schema
   - Apply the audit trigger SQL from `backend/drizzle/0008_audit_trigger.sql`
   - Run the seed script
   - Full command sequence:
     ```
     cd backend && npx drizzle-kit push --force
     cd backend && npx tsx -e "import { db } from './src/db/index.js'; import { sql } from 'drizzle-orm'; import { readFileSync } from 'fs'; const trigger = readFileSync('./drizzle/0008_audit_trigger.sql', 'utf8'); await db.execute(sql.raw(trigger)); console.log('Audit trigger applied'); process.exit(0);"
     cd backend && npm run db:seed
     ```

3. **`make db-seed`** - Just run the seed script:
   - Simply: `cd backend && npm run db:seed`

Include:
- `.PHONY` declarations for all targets
- Brief comments explaining each target
- A default target that shows available commands (help)
  </action>
  <verify>
Run `make` (should show help), `make db-seed` (should seed if DB is running), verify Makefile syntax with `make -n dev` (dry run).
  </verify>
  <done>
Makefile exists at project root with all three commands working. `make` shows help, `make dev` starts both servers, `make db-reset` resets DB with audit trigger, `make db-seed` seeds the database.
  </done>
</task>

</tasks>

<verification>
- [ ] `make` shows available commands (help)
- [ ] `make -n dev` shows the correct command sequence (dry run)
- [ ] `make -n db-reset` shows full reset sequence including audit trigger
- [ ] `make -n db-seed` shows seed command
- [ ] Makefile has `.PHONY` declarations
</verification>

<success_criteria>
- Makefile exists at project root
- All three targets (dev, db-reset, db-seed) are functional
- `make dev` starts both backend and frontend concurrently
- `make db-reset` performs full reset including audit trigger application
- `make db-seed` runs only the seed script
</success_criteria>

<output>
After completion, create `.planning/quick/005-create-a-project-global-make-command-for/005-SUMMARY.md`
</output>
