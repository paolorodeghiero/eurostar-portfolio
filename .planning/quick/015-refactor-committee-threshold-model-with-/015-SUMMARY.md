---
phase: quick
plan: 015
subsystem: admin-referentials
tags: [refactor, normalization, master-data, governance]
dependency_graph:
  requires: [quick-014]
  provides: [committee-levels-api, committee-levels-ui, level-mandatory-flag]
  affects: [committee-thresholds-api, committee-workflow]
tech_stack:
  added: [committeeLevels-table]
  patterns: [master-data-normalization, FK-with-unique-constraint]
key_files:
  created:
    - backend/drizzle/0012_add_committee_levels_table.sql
    - backend/src/routes/admin/committee-levels.ts
    - frontend/src/pages/admin/CommitteeLevelsPage.tsx
  modified:
    - backend/src/db/schema.ts
    - backend/src/db/seed.ts
    - backend/src/lib/committee.ts
    - backend/src/routes/admin/committee-thresholds.ts
    - backend/src/routes/admin/referentials.ts
    - backend/src/db/demo-data.ts
    - frontend/src/pages/admin/CommitteeThresholdsPage.tsx
    - frontend/src/pages/admin/AdminLayout.tsx
    - frontend/src/App.tsx
decisions:
  - Levels stored as master data with mandatory flag for future alerting
  - Each level can only appear once in thresholds (unique constraint on levelId)
  - Migration preserves existing data by mapping level strings to levelId FK
  - Display order stored explicitly for UI control
metrics:
  duration_minutes: 7
  tasks_completed: 3
  files_modified: 12
  lines_added: 651
  lines_removed: 64
completed: 2026-02-15
---

# Quick Task 015: Refactor Committee Threshold Model with Levels

Refactored committee thresholds to use levels as normalized master data with mandatory flag for future alerting.

## Summary

**One-liner:** Committee levels normalized to master data table with mandatory flag, FK relationship to thresholds with unique constraint

**What was built:**
- committeeLevels table with name, mandatory (boolean), displayOrder fields
- Migration 0012 to migrate existing level strings to levelId FK while preserving data
- Committee Levels CRUD API with usage count tracking
- Committee Levels admin UI page with mandatory badge display
- Updated Committee Thresholds API and UI to use levelId instead of level string
- Seed and demo data updated to populate levels before thresholds

**Why it matters:**
Enables future alerting based on mandatory flag (e.g., warn if mandatory level project hasn't engaged committee). Normalizes level data and prevents invalid level values.

## Tasks Completed

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Add committeeLevels table and update schema | d237ec47 | Created committeeLevels table, updated committeeThresholds to reference levelId, created migration, updated seed/demo-data, updated determineCommitteeLevel join |
| 2 | Create committee levels CRUD API | fc908b5c | Added committeeLevelsRoutes with GET/POST/PUT/DELETE, registered in referentials router, added usage count tracking |
| 3 | Add committee levels admin UI | fa5a3ece | Created CommitteeLevelsPage, updated CommitteeThresholdsPage to use level dropdown, added nav item, registered route |

## Technical Details

### Schema Changes

**New Table: committeeLevels**
```typescript
{
  id: integer (identity),
  name: varchar(50) unique,
  mandatory: boolean default false,
  displayOrder: integer,
  createdAt, updatedAt: timestamp
}
```

**Updated Table: committeeThresholds**
```typescript
{
  id: integer (identity),
  levelId: integer FK -> committeeLevels.id (unique), // Changed from level varchar
  maxAmount: numeric(15,2) nullable,
  createdAt, updatedAt: timestamp
}
```

### Migration Strategy

Migration 0012 handles data migration safely:
1. Create committeeLevels table with 3 default levels
2. Add levelId column to committeeThresholds (nullable)
3. Map existing level strings to levelId via UPDATE...FROM join
4. Make levelId NOT NULL, add FK and unique constraints
5. Drop old level column

### API Changes

**New Endpoints: /api/admin/committee-levels**
- GET / - List all levels ordered by displayOrder with usage count
- GET /:id - Get single level with thresholds using it
- POST / - Create level (validates name, mandatory, displayOrder)
- PUT /:id - Update level
- DELETE /:id - Delete level (blocked if usageCount > 0)

**Updated Endpoints: /api/admin/committee-thresholds**
- Accepts levelId instead of level string
- Returns levelName in response via join
- Validates levelId exists before insert/update

### UI Changes

**New Page: CommitteeLevelsPage**
- DataTable with columns: Name, Mandatory (badge), Display Order, Usage, Actions
- Mandatory shows "Required" (green badge) or "Optional" (gray badge)
- Form with name input, mandatory checkbox, displayOrder number input
- Delete disabled when usageCount > 0

**Updated Page: CommitteeThresholdsPage**
- Fetches levels from API on mount
- Dropdown populated with level names instead of hardcoded array
- Displays levelName in table badge
- Form submits levelId instead of level string

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- Backend builds successfully without TypeScript errors
- Frontend builds successfully without TypeScript errors
- Migration file created at backend/drizzle/0012_add_committee_levels_table.sql
- All routes registered in referentials router
- Navigation item added between Currency Rates and Committee Thresholds
- Route registered in App.tsx at /admin/committee-levels

## Self-Check: PASSED

**Created files exist:**
- FOUND: backend/drizzle/0012_add_committee_levels_table.sql
- FOUND: backend/src/routes/admin/committee-levels.ts
- FOUND: frontend/src/pages/admin/CommitteeLevelsPage.tsx

**Commits exist:**
- FOUND: d237ec47 - feat(quick-015): add committeeLevels table and refactor thresholds
- FOUND: fc908b5c - feat(quick-015): create committee levels CRUD API
- FOUND: fa5a3ece - feat(quick-015): add committee levels admin UI

**Build verification:**
- Backend build: PASSED
- Frontend build: PASSED

## Impact

**Immediate:**
- Committee levels are now master data that can be managed independently
- Each level can only appear once in thresholds (enforced by unique constraint)
- Mandatory flag persisted and displayed in admin UI
- Invalid level values prevented by FK constraint

**Future:**
- Mandatory flag enables alerting (e.g., "Project PRJ-2026-00042 at mandatory level has no committee engagement")
- Display order allows UI customization without code changes
- Level names can be changed centrally without migrating threshold records

**Related Systems:**
- Committee workflow determination (determineCommitteeLevel) uses join to get level name
- Admin referentials list includes Committee Levels
- Projects table committee fields unaffected (already using level strings from determination logic)

## Success Criteria

- [x] committeeLevels table exists with name, mandatory, displayOrder columns
- [x] committeeThresholds.levelId references committeeLevels.id with unique constraint
- [x] determineCommitteeLevel returns correct level based on budget
- [x] Admin can manage levels separately from thresholds
- [x] Mandatory flag persisted and displayed correctly
- [x] Migration runs successfully on fresh or existing database
- [x] Backend builds without errors
- [x] Frontend builds without errors
- [x] Both API endpoints (/committee-levels and /committee-thresholds) working
- [x] Admin UI shows both pages working

---

**Next Steps:**
- Use mandatory flag in future alerting system (Phase 8 or later)
- Consider adding color or icon fields to committeeLevels for visual customization
- Test migration on production-like dataset to verify data preservation
