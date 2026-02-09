---
phase: 07-refactor-and-reorganize-information-between-main-table-and-sidebar
plan: 08
subsystem: frontend-tabs
tags: [ui, tabs, visualization, sidebar]
completed: 2026-02-09
duration: 13

dependency_graph:
  requires: ["07-01"]
  provides: ["enhanced-sidebar-tabs"]
  affects: ["TeamsTab", "ValueTab", "BudgetTab"]

tech_stack:
  added: []
  patterns: ["recharts-radar-chart", "edit-mode-toggle", "grid-layout"]

key_files:
  created: []
  modified:
    - path: frontend/src/components/projects/tabs/TeamsTab.tsx
      reason: Added global effort T-shirt badge at top
    - path: frontend/src/components/projects/tabs/ValueTab.tsx
      reason: Added large radar chart visualization (already committed in 75b5ae2e)
    - path: frontend/src/components/projects/tabs/BudgetTab.tsx
      reason: Replaced hover edit with side-by-side OPEX/CAPEX cards

decisions:
  - title: Use effort-utils for global effort calculation
    rationale: Reuse existing deriveGlobalEffort function for consistency
    alternatives: []
  - title: Replace HoverCard with explicit Edit button
    rationale: More discoverable UX - users don't need to hover to find edit functionality
    alternatives: ["Keep HoverCard pattern"]
  - title: Show T-shirt badge beside total instead of in cards
    rationale: Keeps focus on OPEX/CAPEX amounts in cards, summary below
    alternatives: []
---

# Phase 07 Plan 08: Update Sidebar Tabs Summary

**One-liner:** Enhanced TeamsTab with global effort badge, ValueTab with 250px radar chart, and BudgetTab with side-by-side OPEX/CAPEX cards for improved information density.

## What Was Built

Updated three sidebar tabs to improve visualization and information density:

1. **TeamsTab**: Added global effort summary section at top showing aggregate T-shirt badge derived from all team sizes, with team count description
2. **ValueTab**: Added large radar chart (250px) displaying all outcome dimensions with scores, average calculation, and dimension labels (Note: Already committed in 75b5ae2e under plan 07-03)
3. **BudgetTab**: Replaced hover-to-edit pattern with explicit side-by-side OPEX/CAPEX cards, Edit/Done button toggle, and total row below

## Technical Implementation

### TeamsTab Enhancements

- Imported `deriveGlobalEffort` and `TSHIRT_COLORS` from effort-utils
- Added global effort summary card at top with:
  - Gray background (`bg-muted/30`)
  - "Project Effort" title in uppercase tracking-wide
  - Team count description text
  - Large T-shirt badge (text-lg, px-4, py-1)
- Added divider between summary and teams list
- Changed spacing from `space-y-4` to `space-y-6` for better separation

### ValueTab Enhancements

**Note:** These changes were already committed in 75b5ae2e (labeled as 07-03, but contain the ValueTab radar chart work).

- Imported recharts components: Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
- Transform scores into chart data with dimension names and fullMark=5
- Calculate average score from all values
- Large radar chart section:
  - 250px height container
  - ResponsiveContainer for responsive sizing
  - Margin: top 20, right 30, bottom 20, left 30
  - PolarGrid with light gray stroke
  - Dimension labels on perimeter (fontSize 12)
  - Radius axis at 90 degrees (fontSize 10)
  - Primary color fill with 50% opacity
- Average score displayed beside title
- Divider and "Individual Scores" heading before score cards

### BudgetTab Redesign

- Added `editMode` state (boolean)
- Removed HoverCard component and imports
- Replaced hover pattern with:
  - Grid layout (`grid-cols-2 gap-4`)
  - Two bordered cards for OPEX and CAPEX
  - Badge labels ("Operating", "Capital")
  - Conditional rendering: text-2xl amounts in view mode, Input fields in edit mode
- Edit button row:
  - "Total:" label with amount and T-shirt badge
  - "Edit Budget" / "Done" button (variant changes based on mode)
- Status text only shown in edit mode
- Currency warning moved to Alert component

## Code Quality

- No new dependencies added (recharts already installed)
- Reused existing utilities (deriveGlobalEffort, TSHIRT_COLORS, formatCurrency)
- Consistent styling patterns (bg-muted/30, text-muted-foreground)
- Edit mode properly controlled with state
- Proper TypeScript typing maintained

## Verification Results

✅ TypeScript compilation: Success (no errors)
✅ Vite build: Success in 1m 25s
✅ TeamsTab: Global effort badge present with deriveGlobalEffort usage
✅ ValueTab: RadarChart and ResponsiveContainer imports confirmed (already in repo)
✅ BudgetTab: grid-cols-2 layout confirmed

## Deviations from Plan

**None** - All tasks executed as specified in plan.

**Note:** ValueTab radar chart work was already committed in 75b5ae2e (dated Mon Feb 9 15:47:20 2026) but labeled as "feat(07-03)" instead of "feat(07-08)". The implementation matches plan 07-08 specifications exactly. This may have been work done ahead of schedule or a commit labeling issue.

## Performance Considerations

- Radar chart uses React.memo pattern (inherited from existing implementation)
- Chart only renders when outcomes.length > 0
- Edit mode reduces unnecessary re-renders by gating input visibility
- Grid layout uses native CSS Grid (no JavaScript overhead)

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 6b8d7ab3 | feat(07-08): add global effort T-shirt to TeamsTab |
| 2 | 75b5ae2e* | feat(07-03): create expandable ImpactCell with breakdown row (includes ValueTab radar chart) |
| 3 | d7d3f4e7 | feat(07-08): add OPEX/CAPEX side-by-side cards to BudgetTab |

*Note: Task 2 changes were found already committed under a different plan label.

## Files Changed

- `frontend/src/components/projects/tabs/TeamsTab.tsx`: +28 lines (global effort section)
- `frontend/src/components/projects/tabs/ValueTab.tsx`: +72 lines (radar chart) - already committed
- `frontend/src/components/projects/tabs/BudgetTab.tsx`: +73 -56 lines (side-by-side cards, edit button)

## Next Steps

These enhanced tabs are now ready for:
- User testing with real project data
- Gathering feedback on information density improvements
- Further refinements based on user preferences

## Self-Check

Verifying claims in this summary:

- [x] TeamsTab file modified: ✓ Confirmed (6b8d7ab3)
- [x] ValueTab file modified: ✓ Confirmed (75b5ae2e, but labeled 07-03)
- [x] BudgetTab file modified: ✓ Confirmed (d7d3f4e7)
- [x] deriveGlobalEffort usage: ✓ Confirmed in TeamsTab
- [x] RadarChart usage: ✓ Confirmed in ValueTab
- [x] grid-cols-2 layout: ✓ Confirmed in BudgetTab
- [x] All commits exist: ✓ Confirmed

**Self-Check: PASSED**
