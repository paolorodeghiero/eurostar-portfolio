---
phase: quick
plan: 012
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/db/schema.ts
  - backend/src/db/seed.ts
  - backend/src/routes/admin/statuses.ts
  - backend/src/routes/projects/projects.ts
  - frontend/src/lib/project-api.ts
  - frontend/src/pages/admin/StatusesPage.tsx
  - frontend/src/components/projects/ProjectMenu.tsx
  - frontend/src/components/projects/ProjectSidebar.tsx
autonomous: true

must_haves:
  truths:
    - "Draft, Stopped, and Completed are system statuses that cannot be deleted"
    - "Stopped status makes project read-only (isReadOnly: true)"
    - "Admin UI shows 'System' badge for system statuses and disables delete"
    - "Project menu no longer shows Stop/Reactivate actions"
    - "All statuses appear in project status dropdown"
    - "Read-only mode triggers based on status.isReadOnly instead of isStopped"
  artifacts:
    - path: "backend/src/db/schema.ts"
      provides: "isSystemStatus and isReadOnly columns on statuses, previousStatusId on projects"
    - path: "backend/src/db/seed.ts"
      provides: "Draft/Stopped/Completed seeded as system statuses"
    - path: "frontend/src/pages/admin/StatusesPage.tsx"
      provides: "System badge display and delete protection"
  key_links:
    - from: "frontend/src/components/projects/ProjectSidebar.tsx"
      to: "project.status.isReadOnly"
      via: "isReadOnly check"
      pattern: "status\\.isReadOnly"
---

<objective>
Unify project lifecycle management by moving stop/reactivate behavior into the status system.

Purpose: Eliminate the separate `isStopped` boolean flag and instead use statuses with `isReadOnly: true` (like Stopped, Completed) to control read-only mode. System statuses (Draft, Stopped, Completed) are protected from deletion.

Output: Schema migration, updated seed data, backend routes, and frontend components reflecting unified status-based lifecycle.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@backend/src/db/schema.ts
@backend/src/db/seed.ts
@backend/src/routes/admin/statuses.ts
@backend/src/routes/projects/projects.ts
@frontend/src/lib/project-api.ts
@frontend/src/pages/admin/StatusesPage.tsx
@frontend/src/components/projects/ProjectMenu.tsx
@frontend/src/components/projects/ProjectSidebar.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update backend schema, seed, and API</name>
  <files>
    backend/src/db/schema.ts
    backend/src/db/seed.ts
    backend/src/routes/admin/statuses.ts
    backend/src/routes/projects/projects.ts
  </files>
  <action>
1. **schema.ts** - Update statuses table:
   - Add `isSystemStatus: boolean('is_system_status').notNull().default(false)` - marks Draft/Stopped/Completed as system statuses that cannot be deleted
   - Add `isReadOnly: boolean('is_read_only').notNull().default(false)` - marks statuses like Stopped/Completed where project becomes read-only

2. **schema.ts** - Update projects table:
   - Add `previousStatusId: integer('previous_status_id').references(() => statuses.id, { onDelete: 'set null' })` - stores status before transitioning to Stopped (for reactivation)
   - Keep `isStopped` column for now (will be removed in separate migration after data migration)

3. **seed.ts** - Update status seeding to include new flags:
   ```typescript
   { name: 'Draft', color: '#9CA3AF', displayOrder: 1, isSystemStatus: true, isReadOnly: false },
   { name: 'Ready', color: '#3B82F6', displayOrder: 2, isSystemStatus: false, isReadOnly: false },
   { name: 'In Progress', color: '#F59E0B', displayOrder: 3, isSystemStatus: false, isReadOnly: false },
   { name: 'On Hold', color: '#EF4444', displayOrder: 4, isSystemStatus: false, isReadOnly: false },
   { name: 'Completed', color: '#10B981', displayOrder: 5, isSystemStatus: true, isReadOnly: true },
   { name: 'Cancelled', color: '#6B7280', displayOrder: 6, isSystemStatus: false, isReadOnly: false },
   { name: 'Stopped', color: '#DC2626', displayOrder: 7, isSystemStatus: true, isReadOnly: true },
   ```

4. **statuses.ts** - Update admin routes:
   - GET `/` - Include isSystemStatus and isReadOnly in response
   - DELETE `/:id` - Block deletion if isSystemStatus is true (return 400 with message "Cannot delete system status")
   - POST `/` and PUT `/:id` - Prevent setting isSystemStatus via API (server-controlled)

5. **projects.ts** - Update stop/reactivate endpoints to use status transition:
   - PATCH `/:id/stop` - Find "Stopped" status by name, save current statusId to previousStatusId, set statusId to Stopped
   - PATCH `/:id/reactivate` - Restore previousStatusId to statusId, clear previousStatusId
   - GET routes - Include status.isReadOnly in response so frontend can determine read-only mode
   - PUT `/:id` - Allow status changes to any status (including Stopped/Completed) but prevent updates if current status.isReadOnly is true
  </action>
  <verify>
    `cd backend && npm run build` compiles without errors.
    `cd backend && npm run db:push` applies schema changes.
    `cd backend && npm run seed` seeds data with new status flags.
  </verify>
  <done>
    - Statuses table has isSystemStatus and isReadOnly columns
    - Projects table has previousStatusId column
    - Seed creates Draft/Stopped/Completed as system statuses
    - Admin API returns new fields and blocks system status deletion
    - Stop/reactivate use status transitions with previousStatusId tracking
  </done>
</task>

<task type="auto">
  <name>Task 2: Update frontend for unified status system</name>
  <files>
    frontend/src/lib/project-api.ts
    frontend/src/pages/admin/StatusesPage.tsx
    frontend/src/components/projects/ProjectMenu.tsx
    frontend/src/components/projects/ProjectSidebar.tsx
  </files>
  <action>
1. **project-api.ts** - Update Project interface:
   - Add to status type: `isSystemStatus?: boolean; isReadOnly?: boolean`
   - Keep isStopped for backward compatibility but add comment noting it's deprecated
   - Keep stopProject/reactivateProject functions (they now do status transitions on backend)

2. **StatusesPage.tsx** - Update admin UI:
   - Add `isSystemStatus` and `isReadOnly` to Status interface
   - Add column after "Usage" showing "System" badge (variant="secondary") when isSystemStatus is true
   - Disable delete button when isSystemStatus is true with tooltip "System status cannot be deleted"
   - Show "Read-only" indicator (small text or badge) for statuses where isReadOnly is true

3. **ProjectMenu.tsx** - Remove Stop/Reactivate menu items:
   - Remove the Stop Project menu item (lines 69-74)
   - Remove the Reactivate menu item (lines 76-81)
   - Remove handleStop and handleReactivate functions
   - Remove imports for Square and RotateCcw icons if no longer used
   - Keep only the Delete menu item
   - This simplifies the menu to just delete - status changes happen via the status dropdown

4. **ProjectSidebar.tsx** - Update read-only detection:
   - Change line 127 from `const isReadOnly = project?.isStopped ?? false;` to:
     `const isReadOnly = project?.status?.isReadOnly ?? false;`
   - This makes read-only mode driven by the status flag instead of the deprecated isStopped boolean
  </action>
  <verify>
    `cd frontend && npm run build` compiles without errors.
    Manual test: Open admin Statuses page, verify "System" badge shows for Draft/Stopped/Completed.
    Manual test: Try to delete Draft status, verify delete button is disabled.
    Manual test: Open project sidebar, change status to Stopped, verify project becomes read-only.
    Manual test: Open project menu, verify Stop/Reactivate options are gone.
  </verify>
  <done>
    - StatusesPage shows System badge and disables delete for system statuses
    - ProjectMenu only shows Delete (no Stop/Reactivate)
    - ProjectSidebar uses status.isReadOnly for read-only mode detection
    - All status dropdowns show all statuses including Stopped/Completed
  </done>
</task>

<task type="auto">
  <name>Task 3: Create migration and run database update</name>
  <files>
    backend/drizzle/*.sql (new migration file)
  </files>
  <action>
1. Generate Drizzle migration for the schema changes:
   ```bash
   cd backend && npx drizzle-kit generate
   ```

2. Review the generated migration SQL to ensure it:
   - Adds is_system_status boolean with default false
   - Adds is_read_only boolean with default false
   - Adds previous_status_id with foreign key to statuses
   - Does NOT drop isStopped yet (keeping for backward compatibility)

3. Apply the migration:
   ```bash
   cd backend && npm run db:push
   ```

4. Run seed to update existing status records:
   ```bash
   cd backend && npm run seed
   ```

5. Verify data by checking statuses table has correct flags set.
  </action>
  <verify>
    `psql` or backend query shows statuses with isSystemStatus=true for Draft/Stopped/Completed.
    `psql` or backend query shows isReadOnly=true for Stopped/Completed statuses.
    Projects table has previousStatusId column.
  </verify>
  <done>
    - Migration file generated and applied
    - Database schema updated with new columns
    - Seed data reflects system status flags
    - Existing functionality preserved with backward compatibility
  </done>
</task>

</tasks>

<verification>
1. Backend builds without errors: `cd backend && npm run build`
2. Frontend builds without errors: `cd frontend && npm run build`
3. Database has new schema: Run `npm run db:push` and `npm run seed`
4. Admin Statuses page shows System badge for Draft/Stopped/Completed
5. Delete is disabled for system statuses
6. Changing project status to Stopped makes it read-only
7. Project menu has no Stop/Reactivate options
</verification>

<success_criteria>
- isSystemStatus and isReadOnly columns exist on statuses table
- previousStatusId column exists on projects table
- Draft, Stopped, Completed are seeded as system statuses
- Stopped and Completed have isReadOnly: true
- Admin UI shows System badge and blocks delete for system statuses
- ProjectMenu no longer has Stop/Reactivate actions
- ProjectSidebar uses status.isReadOnly for read-only mode
- All tests pass and applications build successfully
</success_criteria>

<output>
After completion, create `.planning/quick/012-unify-status-and-state-into-unified-stat/012-SUMMARY.md`
</output>
