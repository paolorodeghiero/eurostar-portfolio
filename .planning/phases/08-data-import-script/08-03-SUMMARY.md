---
phase: 08-data-import-script
plan: 03
subsystem: import-pipeline
tags: [extraction, excel, csv, data-pipeline]
dependency_graph:
  requires: [08-01, 08-02]
  provides: [extract-stage, csv-generation]
  affects: [staging-folder]
tech_stack:
  added: [xlsx, fast-csv]
  patterns: [data-extraction, csv-export, validation-reporting]
key_files:
  created:
    - backend/import/scripts/lib/excel-reader.ts
    - backend/import/scripts/lib/csv-writer.ts
    - backend/import/scripts/extract.ts
  modified:
    - backend/import/scripts/lib/date-parser.ts
    - backend/import/scripts/lib/mapping-loader.ts
decisions:
  - Excel header row at index 1 (row 0 is title row)
  - Date parser supports both "Q1 2026" and "2026 Q1" formats
  - Value scores empty when source uses H/M/L text instead of numeric 1-5
  - Mapping loader handles null YAML sections with optional chaining
  - Column indices corrected to match actual Excel structure (+1 offset from docs)
metrics:
  duration_minutes: 6
  tasks_completed: 2
  files_modified: 5
  commits: 2
  warnings: 2
completed: 2026-02-15
---

# Phase 8 Plan 03: Extract Stage Implementation Summary

**One-liner:** Excel-to-CSV extraction pipeline using positional column access and YAML-based value mapping

## What Was Built

Created the extract stage of the three-stage import pipeline. The extract script reads TPO Portfolio.xlsx and generates normalized CSV files for review before database loading.

### Files Created

1. **backend/import/scripts/lib/excel-reader.ts** (80 lines)
   - `readExcelSheet()` - Named column access
   - `readExcelByIndex()` - Positional column access for reliability
   - `listSheets()` - Workbook sheet enumeration

2. **backend/import/scripts/lib/csv-writer.ts** (82 lines)
   - `writeCsv()` - UTF-8 BOM CSV generation for Excel compatibility
   - `writeReport()` - Markdown extraction report generation

3. **backend/import/scripts/extract.ts** (367 lines)
   - Main extraction logic with column-indexed Excel reading
   - Generates 5 CSV files: projects, teams, value_scores, change_impact, budget
   - Extraction report with entity counts and unique value discovery
   - CLI with --file and --help options

### Files Modified

1. **backend/import/scripts/lib/date-parser.ts**
   - Added "YYYY Q#" format support (e.g., "2025 Q1")
   - Already supported "Q# YYYY" format

2. **backend/import/scripts/lib/mapping-loader.ts**
   - Fixed null YAML section handling with optional chaining
   - Prevents crash when teams/departments mapping sections are empty

## Extraction Results

From TPO Portfolio.xlsx (234 rows):
- **Projects:** 108 extracted
- **Team Assignments:** 273 relationships
- **Value Scores:** 0 (source uses H/M/L text instead of 1-5 scores)
- **Change Impact:** 55 department impact entries
- **Budget Entries:** 45 projects with OPEX/CAPEX data

**Unique Values Discovered:**
- Statuses: 7 (Complete, On Track, Issues, Not started, Stopped variations)
- Teams: 9 IS teams (DIGITAL TECH, OPERATIONS, DATA, CYBER, etc.)
- Departments: 10 impact departments

**Warnings:** 2 unparseable dates ("2028 +" edge case)

## Technical Decisions

### Excel Structure Discovery

The actual Excel file has a title row at index 0, headers at index 1, and data starting at index 2. This differs from the initial CONTEXT.md documentation which assumed headers at row 0.

**Column Index Mapping:**
```
[0]: Strategic Pillar (title column - ignored)
[1]: Status
[2]: Team (lead team)
[3]: IS Portfolio Ref ID
[4]: Project name
[5]: Department Owner
[6]: Starting Date
[8]: Delivery Date
[13-18]: Value scores (Safety, NPS, EBITDA, Regulatory)
[21-28]: IS team effort (8 teams)
[32-42]: Change impact (11 departments)
[48-49]: People (IS Owner, Sponsor)
[51-52]: Budget (OPEX, CAPEX)
```

### Date Parsing Enhancement

Extended `parseFlexibleDate()` to handle reversed quarter format:
- Original: "Q1 2026" → "2026-01-01"
- Added: "2025 Q1" → "2025-01-01"

Both formats now supported for maximum flexibility.

### Empty Value Score Handling

The source Excel uses "H", "M", "L" text values in value score columns instead of numeric 1-5 scores. The extraction correctly produces 0 value scores rather than attempting invalid conversions. This will be addressed in the load stage with a mapping strategy.

### Mapping Loader Robustness

When YAML sections are empty (only comments), `js-yaml` returns `null` instead of an empty object. Fixed with optional chaining:
```typescript
// Before: mapping.teams[value]
// After:  mapping.teams?.[value]
```

## Deviations from Plan

### Auto-fixed Issues (Deviation Rule 1 & 2)

**1. [Rule 1 - Bug] Fixed Excel header row detection**
- **Found during:** Task 2 initial run
- **Issue:** Extraction failed trying to parse "COMMERCIAL" as status
- **Cause:** Row 0 is title, row 1 is headers (not row 0 as assumed)
- **Fix:** Changed `headerRow = rawData[0]` to `rawData[1]`
- **Files modified:** backend/import/scripts/extract.ts
- **Commit:** a95a7650

**2. [Rule 1 - Bug] Fixed column index alignment**
- **Found during:** Task 2 date parsing errors
- **Issue:** Trying to parse "COMMERCIAL" (dept owner) as start date
- **Cause:** Column indices off by 1 due to extra column 0
- **Fix:** Adjusted all COL constants +1 (STATUS: 0→1, TEAM: 1→2, etc.)
- **Files modified:** backend/import/scripts/extract.ts
- **Commit:** a95a7650

**3. [Rule 2 - Critical] Added reversed quarter date format**
- **Found during:** Task 2 execution
- **Issue:** 119 date parse failures for "2025 Q1" format
- **Fix:** Extended date parser regex to match "YYYY Q#" pattern
- **Files modified:** backend/import/scripts/lib/date-parser.ts
- **Commit:** a95a7650

**4. [Rule 1 - Bug] Fixed null YAML section handling**
- **Found during:** Task 2 initial run
- **Issue:** `Cannot read properties of null (reading 'Complete')`
- **Cause:** Empty YAML sections loaded as null, not empty objects
- **Fix:** Added optional chaining in mapTeamName/mapDepartmentName
- **Files modified:** backend/import/scripts/lib/mapping-loader.ts
- **Commit:** a95a7650

## Verification

All verification criteria met:

✅ `npx tsx backend/import/scripts/extract.ts --help` shows usage
✅ `npx tsx backend/import/scripts/extract.ts -f "TPO Portfolio.xlsx"` runs extraction
✅ `ls backend/import/staging/` shows 5 CSV files + report
✅ `cat backend/import/staging/extraction_report.md` shows summary with counts
✅ projects.csv contains refId, name, status columns
✅ teams.csv contains projectRefId, teamName, effortSize, isLead columns
✅ extraction_report.md lists unique statuses/teams/departments
✅ Warnings flag missing required fields and unparseable dates

## Success Criteria

✅ Extract stage reads TPO Portfolio.xlsx Input sheet successfully
✅ Five CSV files generated (projects, teams, value_scores, change_impact, budget)
✅ Extraction report shows entity counts and unique values
✅ Warnings flag missing required fields and unparseable dates
✅ L/M/H effort values converted to S/M/L T-shirt sizes per mapping

## Next Steps

1. Plan 04: Validate stage - schema validation and referential integrity checks
2. Plan 05: Load stage - database insertion with conflict handling
3. Address value score mapping strategy for H/M/L to 1-5 conversion

## Self-Check

Verifying created files and commits exist:

✅ backend/import/scripts/lib/excel-reader.ts exists
✅ backend/import/scripts/lib/csv-writer.ts exists
✅ backend/import/scripts/extract.ts exists
✅ backend/import/staging/projects.csv exists
✅ backend/import/staging/teams.csv exists
✅ backend/import/staging/extraction_report.md exists
✅ Commit a872c522 exists (Task 1)
✅ Commit a95a7650 exists (Task 2)

## Self-Check: PASSED
