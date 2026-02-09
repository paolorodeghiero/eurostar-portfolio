---
phase: 07-refactor-and-reorganize-information-between-main-table-and-sidebar
plan: 04
subsystem: Portfolio Table UI
tags: [ui, table-cells, budget, committee, visualization]
completed: 2026-02-09
duration: 4 minutes

dependency_graph:
  requires:
    - 07-02 (mini visualizations foundation)
  provides:
    - Enhanced budget and committee cells with detailed information
  affects:
    - Portfolio table information density
    - At-a-glance project status visibility

tech_stack:
  added:
    - Intl.NumberFormat with compact notation for K/M formatting
  patterns:
    - React.memo for cell component performance
    - Compact badge + dots pattern for committee progression
    - Dual-line cell layout for progress + text information

key_files:
  created: []
  modified:
    - frontend/src/components/portfolio/columns/BudgetHealthCell.tsx
    - frontend/src/components/portfolio/columns/CommitteeCell.tsx

decisions:
  - Use Intl.NumberFormat with compact notation for K/M amount formatting
  - Show spent/total text below progress bar for better budget context
  - Use compact progression dots instead of large circles for committee workflow
  - Only show progression for mandatory/optional committee levels
  - Terminal states (approved/rejected) shown as separate colored dots
  - Memoize both components for table scroll performance

metrics:
  tasks_completed: 2
  files_modified: 2
  commits: 2
  tests_added: 0
---

# Phase 07 Plan 04: Enhanced Budget and Committee Cell Visualizations Summary

**One-liner:** Added spent/total text to budget cells and level badge + progression dots to committee cells for richer at-a-glance information.

## What Was Built

Enhanced BudgetHealthCell and CommitteeCell components to display more detailed information within the compact table cell format.

### Task 1: BudgetHealthCell with Spent/Total Text

Updated BudgetHealthCell to show:
- Progress bar with color coding (green < 90%, orange 90-100%, red > 100%)
- Spent/total text below bar using compact K/M notation (e.g., "EUR 45K / EUR 100K")
- Smart currency formatting with Intl.NumberFormat
  - Amounts ≥ 1M: 1 decimal place (e.g., "EUR 1.5M")
  - Amounts ≥ 1K: no decimals (e.g., "EUR 45K")
  - Amounts < 1K: full amount (e.g., "EUR 850")
- Red highlight for spent amount when over budget (>100%)
- Currency prop with EUR default
- React.memo wrapper for table scroll performance

**Commit:** `ffd6a38e` - feat(07-04): add spent/total text to BudgetHealthCell

### Task 2: CommitteeCell with Progression Line

Updated CommitteeCell to show:
- Level badge (Mand/Opt/N/A) with color coding per decision 04-07
  - Mandatory: red background
  - Optional: yellow background
  - Not necessary: gray background
- Compact progression dots (1.5px × 1.5px) showing workflow steps
  - Draft → Presented → Discussion
  - Completed steps: primary color
  - Current step: primary color with ring
  - Future steps: muted gray
- Terminal state indicator dot
  - Green for approved
  - Red for rejected
- State text with appropriate colors
- Only shows progression for mandatory/optional levels (hides for N/A)
- React.memo wrapper for table scroll performance

**Replaced large checkmark circles with compact dots for better table density.**

**Commit:** `a5be5d6c` - feat(07-04): add progression line to CommitteeCell

## Deviations from Plan

None - plan executed exactly as written.

## Files Modified

### frontend/src/components/portfolio/columns/BudgetHealthCell.tsx
- Added formatAmount helper function with Intl.NumberFormat compact notation
- Added currency prop (optional, defaults to EUR)
- Changed layout to vertical stack (progress bar + text)
- Added spent/total text display with conditional red highlighting
- Wrapped in React.memo for performance

### frontend/src/components/portfolio/columns/CommitteeCell.tsx
- Added LEVEL_COLORS and LEVEL_LABELS mappings
- Added WORKFLOW_STEPS and TERMINAL_STATES constants
- Added getStepIndex helper to determine current workflow position
- Replaced large workflow circles with compact progression dots
- Added level badge using shadcn Badge component
- Added terminal state indicator dot
- Added state text with conditional coloring
- Wrapped in React.memo for performance

## Technical Decisions

### formatAmount with Compact Notation
Used Intl.NumberFormat with `notation: 'compact'` for K/M formatting. Provides three tiers:
- ≥ 1M: 1 decimal place for clarity
- ≥ 1K: no decimals (most common case)
- < 1K: full amount with currency symbol

### Compact Progression Dots
Replaced the previous 20px × 20px circles with checkmarks with 1.5px × 1.5px dots. This:
- Reduces visual clutter in dense table
- Maintains clear progression indication
- Allows more horizontal space for state text
- Follows Linear/Notion compact cell design

### Conditional Progression Display
Only show progression dots for mandatory/optional committee levels. Projects marked "not_necessary" just show the N/A badge, saving space and reducing visual noise.

## Verification

✅ BudgetHealthCell shows progress bar
✅ BudgetHealthCell shows spent/total text with K/M notation
✅ BudgetHealthCell highlights spent in red when over budget
✅ BudgetHealthCell uses color coding: green < 90%, orange 90-100%, red > 100%
✅ CommitteeCell shows level badge with appropriate colors
✅ CommitteeCell shows progression dots for workflow steps
✅ CommitteeCell shows terminal state indicator (green/red)
✅ CommitteeCell shows current state text
✅ CommitteeCell hides progression for not_necessary level
✅ Both components wrapped in React.memo

## Self-Check: PASSED

**Files exist:**
- ✅ frontend/src/components/portfolio/columns/BudgetHealthCell.tsx
- ✅ frontend/src/components/portfolio/columns/CommitteeCell.tsx

**Commits exist:**
- ✅ ffd6a38e (BudgetHealthCell)
- ✅ a5be5d6c (CommitteeCell)

**Key features verified:**
- ✅ formatAmount function defined in BudgetHealthCell
- ✅ WORKFLOW_STEPS constant defined in CommitteeCell
- ✅ Both components use React.memo
- ✅ Both components have proper TypeScript interfaces

## Next Steps

The enhanced cells are now ready for integration into the portfolio table columns configuration (portfolioColumns.tsx). The cells provide richer information at a glance without requiring users to open the sidebar for basic budget and committee status checks.

Potential follow-up:
- Update portfolioColumns.tsx to pass currency prop to BudgetHealthCell
- Add tooltips to progression dots showing full state names
- Consider adding percentage text back as optional tooltip on hover
