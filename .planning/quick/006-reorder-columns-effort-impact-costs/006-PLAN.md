---
phase: quick
plan: 006
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/portfolio/columns/portfolioColumns.tsx
autonomous: true

must_haves:
  truths:
    - "Effort, Impact, and Cost columns appear consecutively in the table"
    - "Column grouping makes resource/effort-related metrics easy to compare"
  artifacts:
    - path: "frontend/src/components/portfolio/columns/portfolioColumns.tsx"
      provides: "Reordered column definitions"
      contains: "effort.*impact.*costTshirt"
  key_links: []
---

<objective>
Reorder portfolio table columns so Effort, Impact, and Cost (costTshirt) are grouped together.

Purpose: Better visual grouping of resource/effort-related metrics for easier comparison when analyzing projects.
Output: Updated column order in portfolioColumns.tsx
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
Current column order places Effort and Impact together but Cost (costTshirt) is separated further down after PM, IS Owner, and Sponsor columns.

Current order: select, projectId, name, status, leadTeam, dates, valueScore, effort, impact, budgetHealth, committee, pm, isOwner, sponsor, costTshirt, lastActivity, stopped

Target order: Move costTshirt to appear right after impact, grouping all effort/resource columns together.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Reorder columns to group Effort, Impact, and Cost together</name>
  <files>frontend/src/components/portfolio/columns/portfolioColumns.tsx</files>
  <action>
Update the column ordering in two places:

1. In the `portfolioColumns` array, move the Cost T-shirt column definition (lines 254-260) to appear immediately after the Impact column definition (after line 217).

2. In the `defaultColumnOrder` array (lines 306-324), change the order to:
   - Keep: select, projectId, name, status, leadTeam, dates, valueScore
   - Group together: effort, impact, costTshirt
   - Then: budgetHealth, committee, pm, isOwner, sponsor, lastActivity, stopped

The new `defaultColumnOrder` should be:
```typescript
export const defaultColumnOrder = [
  'select',
  'projectId',
  'name',
  'status',
  'leadTeam',
  'dates',
  'valueScore',
  'effort',
  'impact',
  'costTshirt',  // Moved here - grouped with effort/impact
  'budgetHealth',
  'committee',
  'pm',
  'isOwner',
  'sponsor',
  'lastActivity',
  'stopped',
];
```
  </action>
  <verify>
Run TypeScript compilation: `cd frontend && npx tsc --noEmit`
Start frontend and verify columns appear in new order when all columns are visible.
  </verify>
  <done>
Effort, Impact, and Cost columns are adjacent in the portfolio table, enabling easier comparison of resource-related metrics.
  </done>
</task>

</tasks>

<verification>
- TypeScript compiles without errors
- Portfolio table displays columns in new order
- Column picker shows costTshirt grouped with effort/impact in the list
</verification>

<success_criteria>
- Effort, Impact, Cost columns appear consecutively in the table
- No regressions in table functionality (sorting, filtering, visibility toggles)
</success_criteria>

<output>
After completion, create `.planning/quick/006-reorder-columns-effort-impact-costs/006-SUMMARY.md`
</output>
