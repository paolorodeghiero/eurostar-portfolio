---
status: resolved
trigger: "import-mapping-not-applied: Import script not applying YAML mappings for teams and statuses. Teams created with raw abbreviations (DATA, IS) instead of full names. Statuses defaulting instead of being created from mapped values."
created: 2026-02-15T00:00:00Z
updated: 2026-02-15T00:00:00Z
resolved: 2026-02-15T00:00:00Z
---

## Current Focus

hypothesis: team-mapping.yaml is empty - no mappings defined for DATA, IS, etc. Extract.ts calls mapTeamName() correctly, but mapTeamName() returns untrimmed value when no mapping exists. The CSV contains raw team names which then get auto-created in load.ts without being mapped.
test: Verify if team-mapping.yaml has the required mappings or if it's empty
expecting: Will find that the teams section in team-mapping.yaml is empty, causing mapTeamName() to return raw value unchanged
next_action: Check recent commits for team-mapping.yaml changes, verify what mappings should exist

## Symptoms

expected: Teams should map abbreviations to full names (DATA → "Data & Middleware", IS → "Information Systems"). Statuses should be created using mapped values.
actual: Teams created as-is with raw Excel values (DATA, IS). Statuses default to Draft instead of using mapped values.
errors: No errors, just wrong data
reproduction: Run make db-clean && make import-all, check teams and statuses in database
started: Current behavior after recent import changes

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-02-15
  checked: team-mapping.yaml, status-mapping.yaml, outcome-mapping.yaml, tshirt-mapping.yaml
  found: team-mapping.yaml has empty teams and departments sections with only comments, status-mapping.yaml has comprehensive mappings, outcome-mapping.yaml has mappings, tshirt-mapping.yaml has mappings
  implication: The mappings for teams are missing - this is the problem

- timestamp: 2026-02-15
  checked: mapping-loader.ts functions mapTeamName() and mapStatus()
  found: mapTeamName() returns mapping.teams?.[excelValue] ?? excelValue.trim() - if no mapping exists, it returns the original value trimmed, mapStatus() uses default "Draft" for unmapped values
  implication: Without mappings in YAML, raw team names flow through to CSV files

- timestamp: 2026-02-15
  checked: extract.ts usage of mapTeamName()
  found: extract.ts calls mapTeamName(leadTeam) on line 175 and 189, 203 - it IS using the mapping function
  implication: Extract correctly applies mapping function, but since YAML is empty, raw values pass through

- timestamp: 2026-02-15
  checked: load.ts team creation logic
  found: load.ts auto-creates teams from CSV data when teams are missing (lines 126-139), uses row.leadTeam or row.teamName directly from CSV without re-applying mappings
  implication: By the time load.ts sees the data, it's already unmapped CSV values. The mappings should have been applied in extract.ts, but YAML is empty.

## Resolution

root_cause: |
  1. team-mapping.yaml had empty teams and departments sections (only comments)
  2. mapTeamName() and mapDepartmentName() lacked case-insensitive fallback (unlike mapStatus())
  3. load.ts auto-create for statuses was missing displayOrder field

fix: |
  1. Populated team-mapping.yaml with comprehensive team name mappings:
     - Teams: CORPHRFIN→Corp HR & Finance, CUST→Customer, CYBER→Cyber Security, DATA→Data & Middleware, DIGITAL TECH→Digital Technology, INFRA→Infrastructure, OPERATIONS→Operations, PMO→PMO, SALES→Sales
     - Departments: All uppercase and lowercase variants of department abbreviations mapped to full names

  2. Enhanced mapping-loader.ts functions:
     - mapTeamName() now tries: exact match → lowercase match → original value
     - mapDepartmentName() now tries: exact match → lowercase match → original value
     - Matches behavior of mapStatus() which already had case-insensitive fallback

  3. Fixed load.ts auto-create for statuses:
     - Added displayOrder field (required by schema) with incrementing values

verification: VERIFIED
  - Ran make db-clean to reset database
  - Ran full import with: npm run import:all -- --file "/path/to/TPO Portfolio.xlsx"
  - Extraction: 108 projects, 273 team assignments, all mappings applied correctly
  - Load: 108 projects created with mapped team and department names
  - Database verification:
    * Teams table has: Corp HR & Finance, Customer, Cyber Security, Data & Middleware, Digital Technology, Infrastructure, Operations, PMO, Sales
    * Departments table has: Commercial, Finance, General Security, Human Resources, Information Systems, Operations, Rolling Stock, Station, Strategy
    * Sample project ISPRJ-105 verified: name="implement Aikido Code Analysis", leadTeam="Data & Middleware" (mapped from "DATA")

files_changed:
  - backend/import/mappings/team-mapping.yaml (populated with all team and department mappings)
  - backend/import/scripts/lib/mapping-loader.ts (added case-insensitive fallback)
  - backend/import/scripts/load.ts (added displayOrder for auto-created statuses)
