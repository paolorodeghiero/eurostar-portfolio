---
phase: quick-18
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/routes/projects/project-history.ts
  - frontend/src/lib/project-history-api.ts
autonomous: true
requirements: [QUICK-018]

must_haves:
  truths:
    - "Status changes display status name instead of numeric ID"
    - "Team changes display team name instead of numeric ID"
    - "Committee level changes display level name instead of numeric ID"
  artifacts:
    - path: "backend/src/routes/projects/project-history.ts"
      provides: "History endpoint with lookup resolution"
      contains: "resolveReferenceValue"
  key_links:
    - from: "backend/src/routes/projects/project-history.ts"
      to: "statuses, teams, committeeLevels tables"
      via: "drizzle queries for lookup"
      pattern: "statuses|teams|committeeLevels"
---

<objective>
Enhance project history to display human-readable names for referenced data instead of raw IDs.

Purpose: When viewing project history, users see meaningful values like "In Progress" or "Platform Team" instead of cryptic IDs like "3" or "5".
Output: Backend resolves foreign key IDs to names, frontend displays resolved values.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@backend/src/routes/projects/project-history.ts
@frontend/src/lib/project-history-api.ts
@frontend/src/components/projects/tabs/HistoryTab.tsx
@backend/src/db/schema.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add reference lookups to history endpoint</name>
  <files>backend/src/routes/projects/project-history.ts</files>
  <action>
Enhance the GET /:id/history endpoint to resolve foreign key IDs to human-readable names:

1. Define lookup fields that need resolution:
   ```typescript
   const REFERENCE_FIELDS: Record<string, { table: string; field: string }> = {
     statusId: { table: 'statuses', field: 'name' },
     leadTeamId: { table: 'teams', field: 'name' },
     committeeLevelId: { table: 'committee_levels', field: 'name' },
     previousStatusId: { table: 'statuses', field: 'name' },
   };
   ```

2. After fetching audit log entries, collect all unique IDs that need resolution per reference type.

3. Batch-fetch the referenced entities:
   - Query statuses table for all referenced status IDs
   - Query teams table for all referenced team IDs
   - Query committeeLevels table for all referenced level IDs

4. Create lookup maps (id -> name) for each reference type.

5. In the transformation loop where changes are processed, add a `resolvedOldValue` and `resolvedNewValue` field to HistoryChange when the field is a reference field:
   ```typescript
   interface HistoryChange {
     field: string;
     fieldLabel: string;
     oldValue: unknown;
     newValue: unknown;
     resolvedOldValue?: string | null;  // Add this
     resolvedNewValue?: string | null;  // Add this
   }
   ```

6. For each change, if the field is in REFERENCE_FIELDS, look up the resolved name from the appropriate map and populate resolvedOldValue/resolvedNewValue.

The lookups should be efficient - batch all IDs, do 3 queries max (statuses, teams, levels), then map in memory.
  </action>
  <verify>
    - `curl http://localhost:3000/api/projects/1/history` returns entries with resolvedOldValue/resolvedNewValue for status/team changes
    - Non-reference fields (name, startDate, etc.) have null resolved values
    - Performance: No N+1 queries - verify with backend logs
  </verify>
  <done>
    History API returns resolved names for statusId, leadTeamId, committeeLevelId, previousStatusId changes alongside raw IDs.
  </done>
</task>

<task type="auto">
  <name>Task 2: Update frontend to display resolved values</name>
  <files>frontend/src/lib/project-history-api.ts, frontend/src/components/projects/tabs/HistoryTab.tsx</files>
  <action>
1. Update HistoryChange interface in project-history-api.ts:
   ```typescript
   export interface HistoryChange {
     field: string;
     fieldLabel: string;
     oldValue: unknown;
     newValue: unknown;
     resolvedOldValue?: string | null;
     resolvedNewValue?: string | null;
   }
   ```

2. Update formatValue function to prefer resolved values when available:
   ```typescript
   export function formatValue(value: unknown, resolvedValue?: string | null): string {
     // If we have a resolved value, use it
     if (resolvedValue !== undefined && resolvedValue !== null) {
       return resolvedValue;
     }
     // Otherwise fall back to original formatting
     if (value === null || value === undefined) {
       return '(empty)';
     }
     // ... rest of existing logic
   }
   ```

3. Update HistoryEntryCard in HistoryTab.tsx to pass resolved values to formatValue:
   - For INSERT: `formatValue(change.newValue, change.resolvedNewValue)`
   - For DELETE: `formatValue(change.oldValue, change.resolvedOldValue)`
   - For UPDATE: Both old and new values with their resolved counterparts
  </action>
  <verify>
    - Open project sidebar, go to History tab
    - Make a status change on a project
    - Verify history shows "In Progress" not "3"
    - Change lead team, verify history shows team name not ID
    - Verify non-reference changes (name, dates) still display correctly
  </verify>
  <done>
    History tab displays human-readable names for all reference field changes (status, team, committee level).
  </done>
</task>

</tasks>

<verification>
1. Backend test: Fetch history for a project with various changes, confirm resolved values present
2. Frontend visual test: View history tab, confirm all ID fields show names
3. Edge cases: Null values (empty -> value), deleted references (should show ID if lookup fails)
</verification>

<success_criteria>
- Status changes show "Draft", "In Progress", etc. instead of numeric IDs
- Team changes show "Platform Team", "Data Team", etc. instead of numeric IDs
- Committee level changes show level names instead of IDs
- No regression in history display for non-reference fields
- History loading performance unchanged (batched lookups)
</success_criteria>

<output>
After completion, create `.planning/quick/018-use-lookups-in-project-history-to-displa/018-SUMMARY.md`
</output>
