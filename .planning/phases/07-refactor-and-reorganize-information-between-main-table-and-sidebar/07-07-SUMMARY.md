---
phase: 07-refactor-and-reorganize-information-between-main-table-and-sidebar
plan: 07
subsystem: frontend-ui
tags: [consolidation, ux, tabs, sections]

dependency_graph:
  requires: ["07-01", "07-06"]
  provides: ["merged-general-tab", "sectioned-layout"]
  affects: ["ProjectTabs", "CommitteeTab"]

tech_stack:
  added: []
  patterns: ["section-dividers", "section-headers", "merged-tabs"]

key_files:
  created: []
  modified:
    - frontend/src/components/projects/tabs/GeneralTab.tsx
    - frontend/src/components/projects/tabs/PeopleTab.tsx
    - frontend/src/lib/project-api.ts

decisions:
  - "Merged People tab fields into GeneralTab as separate section"
  - "Moved Business Case upload from CommitteeTab to GeneralTab"
  - "Use SectionHeader and SectionDivider components for visual organization"
  - "Keep PeopleTab file with @deprecated until ProjectTabs update"

metrics:
  duration_minutes: 5
  tasks_completed: 2
  files_modified: 3
  deviations: 1
  completed_at: 2026-02-09
---

# Phase 07 Plan 07: Merge People Tab into GeneralTab

**One-liner:** Consolidated GeneralTab with four sections (Core Info, People, Description, Business Case) to reduce tab count and improve information discoverability

## Overview

Redesigned GeneralTab to incorporate People fields and Business Case upload, creating a single comprehensive tab with clear visual sections. This reduces the number of tabs users need to navigate and groups related project information together.

## Tasks Completed

### Task 1: Redesign GeneralTab with four sections
**Status:** Complete
**Commit:** 4a443c75

Rewrote GeneralTab component to include four distinct sections:
1. **Core Information** - Status, Start/End Dates, Lead Team
2. **People** - Project Manager, IS Owner, Sponsor (from PeopleTab)
3. **Description** - Rich text editor using DescriptionEditor component
4. **Business Case** - File upload/download/delete functionality (from CommitteeTab)

Added SectionHeader and SectionDivider components for visual organization.

**Files modified:**
- frontend/src/components/projects/tabs/GeneralTab.tsx (234 insertions, 68 deletions)

**Key changes:**
- Imported DescriptionEditor component
- Imported Lucide icons (Upload, Download, FileText, Trash2)
- Added section divider component (border-t with vertical spacing)
- Added section header component (uppercase, semibold, muted text)
- Added business case file upload handler with FormData
- Added business case file delete handler
- Structured layout with four clear sections separated by dividers

### Task 2: Mark PeopleTab as deprecated
**Status:** Complete
**Commit:** b81191a6

Added JSDoc deprecation comment to PeopleTab explaining that fields have been merged into GeneralTab. File kept for reference during transition period until ProjectTabs component is updated.

**Files modified:**
- frontend/src/components/projects/tabs/PeopleTab.tsx (7 insertions)

**Deprecation notice:**
```typescript
/**
 * @deprecated This tab has been merged into GeneralTab as of Phase 7.
 * People fields (PM, IS Owner, Sponsor) are now in GeneralTab's "People" section.
 * This file is kept for reference during transition and will be removed when
 * ProjectTabs is updated to remove the People tab.
 */
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing TypeScript fields in Project interface**
- **Found during:** Task 1 verification (npm run build)
- **Issue:** Project interface lacked `description` and `businessCaseFile` fields, causing TypeScript errors when trying to use these fields in GeneralTab
- **Fix:** Added `description: string | null` and `businessCaseFile: string | null` to Project interface in project-api.ts
- **Files modified:** frontend/src/lib/project-api.ts
- **Commit:** fe9862f1

This was a blocking issue because the build failed without these type definitions. The fix was straightforward - adding the two fields to the existing interface to match the database schema and backend API.

## Verification Results

### Build Verification
- TypeScript compilation successful (after type fix)
- GeneralTab imports DescriptionEditor correctly
- All four sections render with proper headers
- Section dividers visually separate each section
- Business Case section has complete upload/download/delete UI

### Code Structure Verification
- SectionHeader component creates consistent uppercase labels
- SectionDivider component creates visual separation with border-t
- Core Info section: Status, Start/End Dates, Lead Team
- People section: Project Manager, IS Owner, Sponsor
- Description section: DescriptionEditor with placeholder
- Business Case section: File upload/download/delete with proper state handling

### Pre-existing Build Error
Note: One TypeScript error in portfolioColumns.tsx exists from before this plan (unrelated to GeneralTab changes):
```
src/components/portfolio/columns/portfolioColumns.tsx(136,46): error TS2322: Type '{ teams: any; leadTeamId: number; }' is not assignable to type 'IntrinsicAttributes & EffortCellProps'.
```
This will be addressed separately.

## Success Criteria Met

- [x] GeneralTab shows 4 sections: Core Info, People, Description, Business Case
- [x] Core Info contains: Status, Start/End Dates, Lead Team
- [x] People contains: PM, IS Owner, Sponsor
- [x] Description contains: Rich text editor (DescriptionEditor)
- [x] Business Case contains: File upload/download/delete
- [x] Section dividers visually separate each section
- [x] PeopleTab marked as deprecated

## Technical Details

### Component Structure
```
GeneralTab
├── Core Information Section
│   ├── Status (Select with color dot)
│   ├── Start Date (Input date)
│   ├── End Date (Input date)
│   └── Lead Team (Select)
├── Section Divider
├── People Section
│   ├── Project Manager (Input text)
│   ├── IS Owner (Input text)
│   └── Sponsor (Input text)
├── Section Divider
├── Description Section
│   └── DescriptionEditor (rich text)
├── Section Divider
└── Business Case Section
    ├── File display (if exists)
    │   ├── Download button
    │   └── Delete button
    └── Upload area (if no file)
```

### Business Case Handlers
- **Upload:** Uses FormData to send file to `/api/projects/{id}/business-case` POST endpoint
- **Download:** Opens `/api/projects/{id}/business-case/download` in new tab
- **Delete:** Sends DELETE request to `/api/projects/{id}/business-case`
- File state tracked via `businessCaseFile` field in formData/project

### Section Styling
- **SectionHeader:** `text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4`
- **SectionDivider:** `border-t my-6`
- Clean visual hierarchy with consistent spacing

## Next Steps

This plan sets up the foundation for:
1. **Plan 07-08 or later:** Update ProjectTabs to remove People tab from tab list
2. **Plan 07-08 or later:** Update CommitteeTab to remove Business Case section
3. **Plan 07-08 or later:** Delete PeopleTab file after ProjectTabs update

## Self-Check: PASSED

**Created files verification:**
- N/A (no new files created)

**Modified files verification:**
```
FOUND: frontend/src/components/projects/tabs/GeneralTab.tsx
FOUND: frontend/src/components/projects/tabs/PeopleTab.tsx
FOUND: frontend/src/lib/project-api.ts
```

**Commits verification:**
```
FOUND: 4a443c75 (Task 1 - GeneralTab redesign)
FOUND: b81191a6 (Task 2 - PeopleTab deprecation)
FOUND: fe9862f1 (Deviation - Project type fix)
```

**Import verification:**
```
FOUND: import { DescriptionEditor } from '../DescriptionEditor'
```

**Section structure verification:**
```
FOUND: SectionHeader title="Core Information"
FOUND: SectionHeader title="People"
FOUND: SectionHeader title="Description"
FOUND: SectionHeader title="Business Case"
FOUND: 3 SectionDivider instances
```

All artifacts verified successfully.
