---
phase: 08-data-import-script
plan: 04
subsystem: data-import
tags: [validation, referential-integrity, csv, import-pipeline]
completed: 2026-02-15

dependencies:
  requires: [08-03]
  provides: [validate-stage, referential-checker]
  affects: [import-workflow]

tech-stack:
  added: [zod, fast-csv]
  patterns: [csv-parsing, schema-validation, referential-checking]

key-files:
  created:
    - backend/import/scripts/validate.ts
    - backend/import/scripts/lib/referential-checker.ts
  modified: []

decisions:
  - CSV schema validation using Zod for type safety and error reporting
  - Separate referential checker utility for database lookup and auto-creation
  - Validation report format matches extraction report for consistency
  - Auto-create mode respects team-mapping.yaml configuration
  - Missing statuses/outcomes block import, missing teams/departments can be auto-created
  - Exit code 0 when validation passes, 1 when critical issues exist

metrics:
  duration: 2
  tasks: 2
  files: 2
---

# Phase 08 Plan 04: Validate Stage Implementation Summary

**One-liner:** CSV schema validation and referential integrity checker with auto-creation support

## What Was Built

Created the validation stage of the import pipeline that checks staging CSV files for schema compliance and verifies referential integrity against the database.

### Core Components

1. **Referential Checker Utility** (`referential-checker.ts`)
   - Loads existing teams, departments, statuses, outcomes from database
   - Builds case-insensitive lookup maps for each entity type
   - Identifies missing referentials by comparing CSV data against database
   - Supports auto-creation of missing teams and departments
   - Helper functions for ID lookups (getTeamId, getStatusId, getOutcomeId)

2. **Validate Stage Script** (`validate.ts`)
   - Parses all staging CSV files (projects, teams, value_scores, change_impact, budget)
   - Validates schema compliance using Zod schemas
   - Checks referential integrity (teams, departments, statuses, outcomes)
   - Auto-creates missing teams/departments when --auto-create flag enabled
   - Generates validation_report.md with detailed error breakdown
   - CLI with --help and --auto-create flags

### Validation Rules

**Schema Validation:**
- Projects: required fields (refId, name, status), numeric budgets
- Teams: T-shirt effort sizes (XS, S, M, L, XL, XXL), boolean isLead flag
- Value Scores: score range 1-5, required outcomeName
- Change Impact: T-shirt impact sizes, required departmentName
- Budget: 3-character currency code (ISO 4217), numeric amounts

**Referential Validation:**
- Statuses must exist in database (mapping required in status-mapping.yaml)
- Outcomes must exist in database (mapping required in outcome-mapping.yaml)
- Teams can be auto-created if auto_create_missing enabled in team-mapping.yaml
- Departments can be auto-created if auto_create_missing enabled

**Exit Behavior:**
- Exit 0: All statuses/outcomes mapped, ready for load stage
- Exit 1: Missing status/outcome mappings, cannot proceed

### Validation Report

Generated `staging/validation_report.md` contains:
- Summary table (total rows, schema errors, referential errors)
- Missing statuses requiring mapping
- Missing outcomes requiring mapping
- Missing teams (will be auto-created)
- Missing departments (will be auto-created)
- First 50 validation warnings with file:row location

## Test Results

Validated staging CSVs from extract stage (08-03):
- 108 projects validated
- 273 team assignments validated
- 0 value scores (test data has none)
- 55 change impact entries validated
- 45 budget entries validated
- **Total: 481 rows validated with 0 schema errors**

Referential check identified:
- 9 missing teams (will be auto-created)
- 19 missing departments (will be auto-created)
- 0 missing statuses (all mapped)
- 0 missing outcomes (none in test data)

Validation passed with exit code 0.

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

**Inputs:**
- Staging CSV files from extract stage (08-03)
- YAML mapping configurations (status-mapping.yaml, outcome-mapping.yaml, team-mapping.yaml)
- Database connection for referential lookups

**Outputs:**
- validation_report.md in staging directory
- Console output with validation summary
- Exit code (0 = pass, 1 = fail)
- Auto-created teams/departments in database (if --auto-create flag used)

**Next Stage:**
- Load stage (08-05) will use validated CSVs to insert/update projects
- Referential checker will be reused during load for ID lookups

## Key Decisions

1. **Zod for schema validation**: Type-safe validation with detailed error messages
2. **Case-insensitive referential matching**: Prevents duplicate teams/departments with different casing
3. **Auto-create mode**: Reduces manual work for missing teams/departments
4. **Blocking validation**: Missing statuses/outcomes prevent load to ensure data quality
5. **Non-blocking warnings**: Missing teams/departments reported but don't block import

## Files Changed

### Created
- `backend/import/scripts/lib/referential-checker.ts` (140 lines)
  - checkReferentials function with comprehensive missing entity detection
  - createMissingTeams and createMissingDepartments for auto-creation
  - Helper ID lookup functions for load stage

- `backend/import/scripts/validate.ts` (339 lines)
  - CSV parsing with schema validation
  - Referential integrity checking
  - Validation report generation
  - CLI with --auto-create and --help flags

## Self-Check: PASSED

Verified created files exist:
- backend/import/scripts/lib/referential-checker.ts: FOUND
- backend/import/scripts/validate.ts: FOUND

Verified commits exist:
- 469be406 (Task 1: referential checker): FOUND
- 322fe70c (Task 2: validate stage): FOUND

Verified validation report generated:
- backend/import/staging/validation_report.md: FOUND

All artifacts confirmed present.
