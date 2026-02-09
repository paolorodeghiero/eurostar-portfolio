---
phase: quick
plan: 010
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/projects/tabs/ChangeImpactTab.tsx
autonomous: true

must_haves:
  truths:
    - "Change Impact tab has same layout structure as Effort tab"
    - "Global Impact summary displays aggregate T-shirt badge at top"
    - "Divider separates summary from team list"
    - "Impacted Teams section with Add button follows summary"
  artifacts:
    - path: "frontend/src/components/projects/tabs/ChangeImpactTab.tsx"
      provides: "Restructured Change Impact tab with summary section"
---

<objective>
Apply the same layout structure from the Effort tab (TeamsTab.tsx) to the Change Impact tab (ChangeImpactTab.tsx).

Purpose: Visual consistency between the two related sections in the project sidebar.
Output: ChangeImpactTab with summary header, aggregate badge, divider, and team chips.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/components/projects/tabs/TeamsTab.tsx (reference layout)
@frontend/src/components/projects/tabs/ChangeImpactTab.tsx (target file)
@frontend/src/lib/effort-utils.ts (deriveGlobalImpact, TSHIRT_COLORS)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Restructure ChangeImpactTab with summary section</name>
  <files>frontend/src/components/projects/tabs/ChangeImpactTab.tsx</files>
  <action>
Refactor ChangeImpactTab to match TeamsTab layout structure:

1. Add imports:
   - `Badge` from '@/components/ui/badge'
   - `deriveGlobalImpact, TSHIRT_COLORS` from '@/lib/effort-utils'

2. Add global impact calculation after loading:
   ```tsx
   const globalImpact = deriveGlobalImpact(impactTeams.map(t => ({ impactSize: t.impactSize })));
   ```

3. Restructure the return JSX to match TeamsTab:
   - Change outer div to `space-y-6` (from space-y-4)
   - Add summary section at top (first child):
     ```tsx
     <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
       <div>
         <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
           Change Impact
         </h3>
         <p className="text-xs text-muted-foreground mt-1">
           Aggregate impact based on {impactTeams.length} team{impactTeams.length !== 1 ? 's' : ''}
         </p>
       </div>
       {globalImpact ? (
         <Badge className={`text-lg px-4 py-1 ${TSHIRT_COLORS[globalImpact] || 'bg-gray-300'}`}>
           {globalImpact}
         </Badge>
       ) : (
         <span className="text-muted-foreground">No teams assigned</span>
       )}
     </div>
     ```
   - Add divider: `<div className="border-t" />`
   - Change section header from "Change Impact Teams" to "Impacted Teams"
   - Move the description text ("Teams affected by this project's changes...") to below the team chips area
   - Add T-shirt size reference at the bottom (same as TeamsTab):
     ```tsx
     <div className="mt-4 text-xs text-muted-foreground">
       <strong>T-shirt sizes:</strong> XS (&lt;50md), S (50-150md), M (150-250md), L (250-500md), XL (500-1000md), XXL (&gt;1000md)
     </div>
     ```

4. Update empty state message from "No change impact teams defined." to "No teams assigned yet." for consistency.
  </action>
  <verify>
    - Open a project sidebar
    - Navigate to Change Impact tab
    - Verify: Summary section with "Change Impact" header appears at top
    - Verify: Aggregate T-shirt badge shows (if teams exist) or "No teams assigned"
    - Verify: Horizontal divider separates summary from team list
    - Verify: "Impacted Teams" header with Add button
    - Verify: Layout matches Effort tab structure
  </verify>
  <done>
    Change Impact tab has identical layout structure to Effort tab with summary header, aggregate badge, divider, team section, and footer reference.
  </done>
</task>

</tasks>

<verification>
- Visual comparison: Effort tab and Change Impact tab have matching layouts
- Summary section displays aggregate impact size correctly
- Empty state shows "No teams assigned" in badge area
- T-shirt size reference appears at bottom
</verification>

<success_criteria>
- Change Impact tab layout matches Effort tab structure
- Global impact badge derives correctly from team sizes using MAX algorithm
- User can visually compare both tabs and see consistent structure
</success_criteria>

<output>
After completion, create `.planning/quick/010-change-impact-effort-layout/010-SUMMARY.md`
</output>
