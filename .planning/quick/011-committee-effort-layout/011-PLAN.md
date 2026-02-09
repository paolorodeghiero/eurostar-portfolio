---
phase: quick
plan: 011
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/projects/tabs/CommitteeTab.tsx
autonomous: true

must_haves:
  truths:
    - "Committee tab has Effort-inspired summary section at top"
    - "Engagement Level displays with styled badge in summary area"
    - "Divider separates summary from workflow progress"
    - "Workflow and state sections follow after divider"
  artifacts:
    - path: "frontend/src/components/projects/tabs/CommitteeTab.tsx"
      provides: "Restructured Committee tab with summary header section"
---

<objective>
Apply the Effort-inspired layout structure to the Committee tab, displaying the Engagement Level in a prominent summary section at the top (similar to how Project Effort shows T-shirt size).

Purpose: Visual consistency between sidebar tabs - Committee should follow the same pattern as Effort and Change Impact.
Output: CommitteeTab with summary header showing engagement level, divider, then workflow/state sections.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/components/projects/tabs/TeamsTab.tsx (reference layout pattern)
@frontend/src/components/projects/tabs/CommitteeTab.tsx (target file)
@frontend/src/lib/project-committee-api.ts (LEVEL_LABELS, LEVEL_COLORS)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Restructure CommitteeTab with Effort-style summary section</name>
  <files>frontend/src/components/projects/tabs/CommitteeTab.tsx</files>
  <action>
Refactor CommitteeTab to match the Effort tab layout pattern:

1. Move the "Engagement Committee Level" section to a styled summary box at the top:
   ```tsx
   {/* Engagement Level Summary */}
   <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
     <div>
       <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
         Engagement Level
       </h3>
       <p className="text-xs text-muted-foreground mt-1">
         {status.committeeLevel === 'mandatory' && 'Committee approval required for this budget level'}
         {status.committeeLevel === 'optional' && 'Committee review is optional'}
         {status.committeeLevel === 'not_necessary' && 'No committee review needed'}
         {!status.committeeLevel && 'Set project budget to determine level'}
       </p>
     </div>
     {status.committeeLevel ? (
       <Badge className={`text-lg px-4 py-1 ${LEVEL_COLORS[status.committeeLevel] || 'bg-gray-100 text-gray-800'}`}>
         {LEVEL_LABELS[status.committeeLevel] || status.committeeLevel}
       </Badge>
     ) : (
       <span className="text-muted-foreground">Not set</span>
     )}
   </div>
   ```

2. Add a divider after the summary section:
   ```tsx
   <div className="border-t" />
   ```

3. Keep the Workflow Progress section but simplify its header to just "Workflow" (consistent naming):
   - Change h3 text from "Workflow Progress" to "Workflow"

4. Keep the Current State section with the transition buttons unchanged.

5. Remove the duplicate level description text that was below the old badge (lines 112-116 in original) since it's now integrated into the summary section.

The result should flow: Summary -> Divider -> Workflow -> Current State -> Transitions
  </action>
  <verify>
    - Open a project sidebar
    - Navigate to Committee tab
    - Verify: Summary section with "Engagement Level" header appears at top in bg-muted/30 rounded box
    - Verify: Large styled badge shows level (Mandatory/Optional/Not Required) or "Not set"
    - Verify: Description text below header explains the level
    - Verify: Horizontal divider separates summary from workflow
    - Verify: Workflow progress stepper follows the divider
    - Verify: Current state and transitions work as before
  </verify>
  <done>
    Committee tab has Effort-inspired layout with engagement level in prominent summary section, divider, then workflow/state sections matching visual consistency with other tabs.
  </done>
</task>

</tasks>

<verification>
- Visual comparison: Committee tab summary section matches Effort tab structure
- Engagement level badge displays correctly with appropriate color
- Empty state shows "Not set" when committeeLevel is null
- Workflow progress and state transitions still function correctly
</verification>

<success_criteria>
- Committee tab layout follows Effort-inspired pattern
- Engagement level has prominent display in summary header
- User can visually compare tabs and see consistent structure
</success_criteria>

<output>
After completion, create `.planning/quick/011-committee-effort-layout/011-SUMMARY.md`
</output>
