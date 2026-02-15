---
phase: 08-data-import-script
plan: 05
subsystem: data-import
tags: [import, load, conflict-resolution, dry-run]
dependency_graph:
  requires:
    - 08-04-validate
  provides:
    - load-stage-script
    - conflict-resolver
  affects:
    - projects-table
    - child-entities
tech_stack:
  added:
    - node:readline/promises (interactive CLI)
  patterns:
    - Interactive conflict resolution
    - Merge strategy for child entities
    - Dry-run mode
key_files:
  created:
    - backend/import/scripts/load.ts
    - backend/import/scripts/lib/conflict-resolver.ts
  modified: []
decisions:
  - title: "Interactive conflict resolution with batch options"
    rationale: "Skip/Update/Overwrite with 'All' variants for efficient batch processing"
  - title: "Merge strategy for child entities"
    rationale: "Add new, keep existing - never delete during import to preserve manual edits"
  - title: "Import tracking columns"
    rationale: "importedAt and importSource on projects table for audit trail"
metrics:
  duration_min: 3
  completed_date: 2026-02-15
---

# Phase 08 Plan 05: Load Stage Implementation Summary

**One-liner:** Database load stage with interactive conflict resolution, merge strategy for child entities, and dry-run preview mode.

## What Was Built

Created the final stage of the ETL pipeline that loads validated CSV data into the production database:

1. **Conflict Resolver Utility** (`conflict-resolver.ts`)
   - Interactive CLI prompts for existing project conflicts
   - Skip/Update/Overwrite options with batch "All" variants
   - Field-level change detection and display
   - Persistent readline session across multiple conflicts

2. **Load Stage Script** (`load.ts`)
   - Reads validated CSVs from staging directory
   - Checks for existing projects by projectId
   - Prompts on conflicts with side-by-side field comparison
   - Inserts new projects or updates existing based on resolution
   - Merges child entities (teams, values, impact) - adds new, keeps existing
   - Populates import tracking columns (importedAt, importSource)
   - Dry-run mode for preview without database changes
   - Generates load report with entity counts and errors

## Key Features

### Conflict Resolution
- **Skip:** Keep existing, ignore incoming
- **Update:** Merge only changed fields into existing
- **Overwrite:** Replace all fields with incoming
- **Batch modes:** Skip All, Update All, Overwrite All for efficient processing

### Import Tracking
- `importedAt`: Timestamp when project was imported
- `importSource`: Source filename (e.g., "TPO Portfolio.xlsx")
- Enables audit trail and re-import detection

### Merge Strategy
Child entities use "add new, keep existing" strategy:
- New team assignments, value scores, and impacts are added
- Existing entries are preserved (never deleted)
- Protects manual edits made after initial import

### Dry-Run Mode
- Preview what would be imported without touching database
- Shows CREATE/UPDATE/SKIP decisions for each project
- Generates report with projected changes

## Verification Results

All verification criteria passed:

1. `npx tsx backend/import/scripts/load.ts --help` - Shows comprehensive usage guide
2. `npx tsx backend/import/scripts/load.ts --dry-run` - Processed 108 projects successfully
3. Load report generated with entity counts: 108 projects created, 0 errors

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

**Inputs:**
- `backend/import/staging/projects.csv`
- `backend/import/staging/teams.csv`
- `backend/import/staging/value_scores.csv`
- `backend/import/staging/change_impact.csv`

**Dependencies:**
- `backend/import/scripts/lib/mapping-loader.ts` - For auto-create flag
- `backend/import/scripts/lib/csv-writer.ts` - For report generation
- `backend/src/db/schema.ts` - For database tables

**Outputs:**
- Projects inserted/updated in database
- Child entities (teams, values, impact) merged
- `backend/import/staging/load_report.md` - Load summary

## Technical Notes

### Auto-Create Missing Teams
- When `auto_create_missing: true` in team-mapping.yaml
- Creates teams automatically during import
- Uses first available department as default

### Conflict Detection
- Compares 7 core fields: name, statusId, leadTeamId, startDate, endDate, opexBudget, capexBudget
- Normalizes values for comparison (null/undefined → empty string)
- Only prompts when actual differences found

### Child Entity Processing
- Team assignments: checks unique (projectId, teamId)
- Value scores: checks unique (projectId, outcomeId)
- Change impacts: checks unique (projectId, teamId)
- Skips if exists, inserts if new

## Usage Examples

```bash
# Preview import without changes
npx tsx backend/import/scripts/load.ts --dry-run

# Import with default source name
npx tsx backend/import/scripts/load.ts

# Import with custom source tracking
npx tsx backend/import/scripts/load.ts --source "Q1 2026 Portfolio.xlsx"
```

## Next Steps

This completes the three-stage ETL pipeline:
1. Extract (08-02) - Excel → CSV
2. Validate (08-04) - Referential integrity checks
3. Load (08-05) - CSV → Database

Phase 08 is now complete with a fully functional data import system.

## Self-Check: PASSED

All files created and commits verified:

```bash
✓ backend/import/scripts/lib/conflict-resolver.ts exists
✓ backend/import/scripts/load.ts exists
✓ Commit d3b55d89 exists (Task 1: conflict resolver)
✓ Commit 2889d51c exists (Task 2: load stage)
✓ Load report generated successfully
✓ Dry-run processed 108 projects
```
