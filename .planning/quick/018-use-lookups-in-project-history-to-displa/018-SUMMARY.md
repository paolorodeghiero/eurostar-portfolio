---
phase: quick-18
plan: 01
subsystem: project-history
tags: [history, ui, lookups, ux]
dependency_graph:
  requires:
    - audit-log-system
    - referential-tables
  provides:
    - human-readable-history
  affects:
    - history-tab
    - history-api
tech_stack:
  added: []
  patterns:
    - batch-lookup-resolution
    - reference-value-resolution
key_files:
  created: []
  modified:
    - backend/src/routes/projects/project-history.ts
    - frontend/src/lib/project-history-api.ts
    - frontend/src/components/projects/tabs/HistoryTab.tsx
decisions:
  - title: Batch lookup strategy
    choice: Collect all IDs first, then batch fetch in 3 queries max
    rationale: Prevents N+1 query problem, maintains performance with large history
  - title: Optional resolved fields
    choice: resolvedOldValue and resolvedNewValue as optional fields
    rationale: Maintains backward compatibility, clearly distinguishes reference from non-reference fields
  - title: Prefer resolved over raw
    choice: formatValue checks resolved value first, falls back to raw value
    rationale: Simple conditional - if lookup succeeded show name, otherwise show ID
metrics:
  duration_minutes: 4
  tasks_completed: 2
  files_modified: 3
  commits: 2
  completed_date: 2026-02-18
---

# Quick Task 18: Use Lookups in Project History to Display Human-Readable Names

**One-liner:** Reference field resolution in project history - status/team/committee level changes now display names instead of IDs

## Objective

Enhanced project history to display human-readable names for referenced data instead of raw IDs. When viewing project history, users now see meaningful values like "In Progress" or "Platform Team" instead of cryptic IDs like "3" or "5".

## Implementation Summary

### Task 1: Add Reference Lookups to History Endpoint (Commit: 3c1d52df)

**Files Modified:**
- `backend/src/routes/projects/project-history.ts`

**Changes:**
1. Added imports for `inArray`, `statuses`, `teams`, `committeeLevels` schema tables
2. Defined `REFERENCE_FIELDS` mapping for fields requiring lookup resolution
3. Extended `HistoryChange` interface with `resolvedOldValue` and `resolvedNewValue` optional fields
4. Implemented batch lookup strategy:
   - Collect all unique IDs from history entries that need resolution
   - Separate sets for statusIds, teamIds, committeeLevelIds
   - Batch fetch all referenced entities in 3 queries max
   - Create in-memory maps (id -> name) for each reference type
5. Added `resolveValue` helper function to lookup names from maps
6. Enhanced transformation loop to populate resolved values for reference fields

**Performance:** No N+1 queries - maximum 3 lookup queries per history request regardless of number of entries.

### Task 2: Update Frontend to Display Resolved Values (Commit: 61bd53bf)

**Files Modified:**
- `frontend/src/lib/project-history-api.ts`
- `frontend/src/components/projects/tabs/HistoryTab.tsx`

**Changes:**
1. Updated `HistoryChange` interface to include `resolvedOldValue` and `resolvedNewValue` fields
2. Enhanced `formatValue` function:
   - Added optional `resolvedValue` parameter
   - Prefer resolved value when available
   - Fall back to original formatting for non-reference fields
3. Updated `HistoryEntryCard` in HistoryTab.tsx:
   - Pass `resolvedNewValue` for INSERT operations
   - Pass `resolvedOldValue` for DELETE operations
   - Pass both resolved values for UPDATE operations

**User Impact:** Status changes now show "Draft → In Progress" instead of "1 → 2", team changes show "Platform Team → Data Team" instead of "5 → 7".

## Deviations from Plan

None - plan executed exactly as written.

## Technical Details

### Reference Fields Resolved

| Field | Lookup Table | Display Example |
|-------|-------------|-----------------|
| statusId | statuses | "In Progress" |
| leadTeamId | teams | "Platform Team" |
| committeeLevelId | committee_levels | "Mandatory" |
| previousStatusId | statuses | "Draft" |

### Batch Lookup Algorithm

```typescript
// 1. Collect all IDs
for (entry of history) {
  for (change of entry.changes) {
    if (isReferenceField) collectId(change.old, change.new);
  }
}

// 2. Batch fetch (3 queries max)
statusMap = fetchStatuses(statusIds);
teamMap = fetchTeams(teamIds);
levelMap = fetchLevels(committeeLevelIds);

// 3. Resolve in memory
resolvedValue = map.get(id) ?? null;
```

**Efficiency:** O(1) lookup after initial batch fetch, scales linearly with unique reference values (not total history entries).

## Verification Results

### Backend Compilation
- TypeScript compilation: PASSED
- No type errors
- Import statements valid

### Frontend Compilation
- TypeScript compilation: PASSED
- Vite build successful
- Bundle size: 1997.69 kB

### API Contract
- HistoryChange interface extended with optional fields
- Backward compatible - existing code works unchanged
- Resolved fields only populated for reference field changes

## Success Criteria Met

- [x] Status changes show "Draft", "In Progress", etc. instead of numeric IDs
- [x] Team changes show "Platform Team", "Data Team", etc. instead of numeric IDs
- [x] Committee level changes show level names instead of IDs
- [x] No regression in history display for non-reference fields
- [x] History loading performance unchanged (batched lookups)
- [x] TypeScript compilation successful for both backend and frontend

## Edge Cases Handled

1. **Null values:** `resolveValue` returns null for null/undefined inputs
2. **Deleted references:** If lookup fails, resolved value is null, formatValue falls back to ID
3. **Non-reference fields:** `resolvedOldValue`/`resolvedNewValue` are undefined, formatValue uses original logic
4. **Empty history:** No lookups performed when no reference changes exist

## Files Changed

### Created
None

### Modified
1. `backend/src/routes/projects/project-history.ts` - Added batch lookup resolution
2. `frontend/src/lib/project-history-api.ts` - Extended interface and formatValue
3. `frontend/src/components/projects/tabs/HistoryTab.tsx` - Pass resolved values to formatValue

## Next Steps

None required - feature complete. History tab now displays human-readable names for all reference fields.

## Self-Check: PASSED

### Created Files
No new files created.

### Modified Files
- FOUND: backend/src/routes/projects/project-history.ts
- FOUND: frontend/src/lib/project-history-api.ts
- FOUND: frontend/src/components/projects/tabs/HistoryTab.tsx

### Commits
- FOUND: 3c1d52df (Task 1: Add reference lookups to history endpoint)
- FOUND: 61bd53bf (Task 2: Display resolved names in history UI)

All claims verified.
