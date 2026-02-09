---
phase: 07-refactor-and-reorganize-information-between-main-table-and-sidebar
plan: 09
subsystem: frontend-sidebar-navigation
tags: [refactor, ui-cleanup, tab-reorganization]

requires:
  - phase: 07
    plan: 07
    reason: "GeneralTab with Business Case section must exist before removal from CommitteeTab"
  - phase: 07
    plan: 08
    reason: "Sidebar tabs refactored before navigation update"

provides:
  - name: "CommitteeTab governance-only"
    type: "component"
    description: "Simplified CommitteeTab focused purely on governance workflow"
  - name: "Reorganized tab navigation"
    type: "ui-structure"
    description: "Final tab order with People removed and Teams renamed to Effort"

affects:
  - component: "CommitteeTab"
    impact: "Removed Business Case section (moved to GeneralTab)"
  - component: "ProjectTabs"
    impact: "Updated tab order and names"

tech-stack:
  added: []
  patterns:
    - "Consolidated tab navigation structure"
    - "Removed redundant People tab"
    - "Renamed Teams to Effort for clarity"

key-files:
  created: []
  modified:
    - path: "frontend/src/components/projects/tabs/CommitteeTab.tsx"
      lines: 217
      purpose: "Removed Business Case UI, focused on governance only"
    - path: "frontend/src/components/projects/ProjectTabs.tsx"
      lines: 81
      purpose: "Updated tab configuration with new order and names"

decisions:
  - what: "Remove Business Case from CommitteeTab"
    why: "Business Case belongs with project core info in GeneralTab, not governance workflow"
    impact: "Clearer separation between governance (CommitteeTab) and project details (GeneralTab)"
  - what: "Rename Teams to Effort"
    why: "Better reflects tab content: team involvement and effort sizing"
    impact: "More intuitive tab naming for users"
  - what: "Remove People tab entirely"
    why: "People (owner, project manager, key user) merged into GeneralTab"
    impact: "Reduced tab count from 9 to 8, cleaner navigation"

metrics:
  duration: 4
  completed_date: 2026-02-09
  tasks: 2
  files: 2
  commits: 2
---

# Phase 7 Plan 09: Finalize Sidebar Tab Reorganization Summary

Completed sidebar reorganization by removing Business Case from CommitteeTab and updating tab navigation with People removed and Teams renamed to Effort.

## What Was Done

### Task 1: Remove Business Case from CommitteeTab

**Objective:** Strip Business Case section from CommitteeTab since it was moved to GeneralTab in 07-07.

**Implementation:**
- Removed Business Case file upload/download/delete UI (lines 266-353)
- Removed unused imports: `Upload`, `Download`, `Trash2`, `FileText` icons
- Removed unused API imports: `uploadBusinessCase`, `downloadBusinessCase`, `deleteBusinessCase`
- Removed unused state: `uploading`, `fileInputRef`
- Removed file handler functions: `handleFileSelect`, `handleDownload`, `handleDelete`
- Tab now contains only:
  - Committee Level indicator (Mandatory/Optional/Not Necessary)
  - Workflow state machine visualization (draft → presented → discussion → approved/rejected)
  - State transition buttons

**Files Modified:**
- `frontend/src/components/projects/tabs/CommitteeTab.tsx` (217 lines, -140 lines removed)

**Commit:** `095747a3`

### Task 2: Update ProjectTabs with New Tab Order and Names

**Objective:** Finalize tab navigation structure with People removed and Teams renamed to Effort.

**Implementation:**
- Removed `PeopleTab` import (merged into GeneralTab)
- Updated tabs array to new order:
  1. General
  2. Effort (renamed from Teams)
  3. Value
  4. Change Impact
  5. Committee
  6. Budget
  7. Actuals
  8. History
- Removed People `TabsContent` section
- Updated Teams `TabsContent` value from `'teams'` to `'effort'`
- Default tab remains `'general'`

**Files Modified:**
- `frontend/src/components/projects/ProjectTabs.tsx` (81 lines, -10 lines removed)

**Commit:** `ea39dc16`

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

### Build Verification
```bash
npm run build
✓ TypeScript compilation successful
✓ Vite build completed in 43.17s
✓ No errors or warnings (chunk size warning expected)
```

### Code Verification
```bash
# Verified no business-case references in CommitteeTab
grep -c "business-case" CommitteeTab.tsx → 0

# Verified PeopleTab import removed
grep "PeopleTab" ProjectTabs.tsx → No matches

# Verified Effort tab exists
grep "'effort'" ProjectTabs.tsx → { id: 'effort', label: 'Effort' }
```

### Success Criteria Met
- [x] Tab order: General, Effort, Value, Change Impact, Committee, Budget, Actuals, History
- [x] People tab removed from navigation (merged into General)
- [x] Teams tab shows as "Effort" in navigation
- [x] CommitteeTab contains only committee level and workflow state machine
- [x] Business Case accessible only through GeneralTab (via 07-07)
- [x] Default tab on open is General
- [x] No TypeScript errors in build
- [x] 8 tabs total (down from 9)

## Technical Notes

### CommitteeTab Simplification
The tab now has clear separation of concerns:
1. **Committee Level Display** - Shows mandatory/optional/not_necessary based on budget thresholds
2. **Workflow Visualization** - Progress indicator showing draft → presented → discussion → approved
3. **State Transitions** - Action buttons for allowed state changes (respects state machine rules)

All file operations moved to GeneralTab where Business Case logically belongs with project core information.

### Tab Navigation Structure
Final sidebar navigation reflects information hierarchy:
- **General** - Project identity, people, description, business case
- **Effort** - Team involvement and sizing (renamed for clarity)
- **Value** - Outcome scores and radar visualization
- **Change Impact** - Affected teams and change scope
- **Committee** - Governance workflow (now focused)
- **Budget** - Financial planning
- **Actuals** - Spending tracking
- **History** - Audit trail

## Self-Check: PASSED

### Created Files
N/A - No new files created

### Modified Files
- [x] FOUND: frontend/src/components/projects/tabs/CommitteeTab.tsx
- [x] FOUND: frontend/src/components/projects/ProjectTabs.tsx

### Commits
- [x] FOUND: 095747a3 (refactor(07-09): remove Business Case section from CommitteeTab)
- [x] FOUND: ea39dc16 (refactor(07-09): update tab order and rename Teams to Effort)

All claimed artifacts verified successfully.
