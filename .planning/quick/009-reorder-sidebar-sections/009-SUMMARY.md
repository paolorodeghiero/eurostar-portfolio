---
phase: quick
plan: 009
subsystem: ui/sidebar
tags: [refactor, ux, information-architecture]
requires: [ProjectTabs component]
provides: [improved tab order]
affects: [project sidebar navigation]
tech-stack:
  patterns:
    - Logical grouping of related concepts
key-files:
  created: []
  modified:
    - frontend/src/components/projects/ProjectTabs.tsx
decisions:
  - "Reordered tabs to group related concepts: Effort before Impact, Budget before Committee"
metrics:
  duration: 2
  completed: "2026-02-09"
  tasks: 1
  files: 1
---

# Quick Task 009: Reorder Sidebar Sections Summary

**One-liner:** Reorganized sidebar tabs for better information flow (Effort → Impact → Value, Budget → Committee)

## What Was Done

Reordered the project sidebar tabs to improve information architecture by grouping related concepts together.

### New Tab Order

1. **General** - Core project information and people
2. **Effort** - Team involvement and sizing
3. **Change Impact** - Teams affected by the change
4. **Value** - Value proposition scores
5. **Budget** - Budget management and allocations
6. **Committee** - Governance workflow
7. **Actuals** - Receipts and spending
8. **History** - Audit trail

### Rationale

- **Effort before Change Impact**: Logical flow from who's doing the work to who's affected
- **Budget before Committee**: Committee decisions depend on budget, so view budget first
- Groups related financial concepts (Budget, Committee, Actuals) together
- Maintains General as entry point and History as final tab

## Implementation

**Task 1: Reorder tabs array in ProjectTabs.tsx** ✓
- Updated `tabs` array (lines 21-30) to new order
- Reordered `TabsContent` elements (lines 57-92) to match
- Verified build passes without errors

## Deviations from Plan

None - plan executed exactly as written.

## Technical Decisions

- **Tab array and content order synchronized**: Maintained consistency between declaration and rendering order for maintainability

## Verification Results

- Build passes: `npm run build` completed successfully
- No TypeScript errors
- Tab navigation structure intact

## Files Modified

- `frontend/src/components/projects/ProjectTabs.tsx` - Reordered tabs array and TabsContent elements

## Commits

- `720e5dd5` - refactor(quick-009): reorder sidebar tabs for better information architecture

## Self-Check: PASSED

**File verification:**
```bash
[ -f "frontend/src/components/projects/ProjectTabs.tsx" ] && echo "FOUND"
```
✓ FOUND: frontend/src/components/projects/ProjectTabs.tsx

**Commit verification:**
```bash
git log --oneline --all | grep -q "720e5dd5" && echo "FOUND"
```
✓ FOUND: 720e5dd5

**Build verification:**
✓ Frontend build completed successfully in 1m 15s
