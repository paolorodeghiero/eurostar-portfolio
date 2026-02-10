---
phase: 06-admin-gui-and-reporting
plan: 04
subsystem: admin-gui
tags: [ui, navigation, admin, referential-usage]
dependency_graph:
  requires: [06-01-api-docs]
  provides: [api-docs-navigation, usage-drawer-component]
  affects: [portfolio-header, admin-pages]
tech_stack:
  added: [shadcn-sheet]
  patterns: [side-panel, api-fetch-on-open]
key_files:
  created:
    - frontend/src/components/admin/UsageDrawer.tsx
  modified:
    - frontend/src/components/portfolio/PortfolioHeader.tsx
decisions:
  - decision: "Use FileJson icon for API link"
    rationale: "Clear visual representation of API/JSON documentation"
    alternatives: "Code, BookOpen, ExternalLink icons"
  - decision: "Place API link between Upload Actuals and Alerts"
    rationale: "Logical grouping of global actions before user identity section"
  - decision: "Sheet component already exists in codebase"
    rationale: "No need to create - standard shadcn component already implemented"
metrics:
  duration_minutes: 1
  tasks_completed: 2
  files_created: 1
  files_modified: 1
  commits: 2
  completed_date: 2026-02-10
---

# Phase 06 Plan 04: API Documentation Link and Usage Drawer Summary

**One-liner:** Added API documentation link to navbar and created reusable UsageDrawer component for admin referential item usage visibility.

## Tasks Completed

### Task 1: Add API docs link to PortfolioHeader
**Commit:** 27065e43
**Files:** frontend/src/components/portfolio/PortfolioHeader.tsx

Added FileJson icon from lucide-react and inserted API documentation link in the main navbar between "Upload Actuals" button and "Alerts" dropdown. Link opens `/docs` (Swagger UI) in a new tab with appropriate security attributes (`target="_blank"`, `rel="noopener noreferrer"`). Styling matches existing Admin link pattern for visual consistency.

**Key changes:**
- Imported FileJson icon
- Added anchor tag with href="/docs"
- Opens in new tab (external interface)
- Consistent styling with Admin link

### Task 2: Create UsageDrawer component
**Commit:** 9516630b
**Files:** frontend/src/components/admin/UsageDrawer.tsx

Created reusable UsageDrawer component for admin pages to display which projects are using a specific referential item (department, team, status, etc.). Component uses the existing shadcn Sheet component for side panel UI.

**Key changes:**
- Generic interface accepting referentialType, referentialId, referentialName
- Fetches from `/api/admin/{type}/{id}/usage` on open
- Displays project list with ID, name, status, role, and score
- Loading state during fetch
- Empty state message when no projects use the item
- Responsive width: 400px mobile, 540px desktop
- Smooth slide-in animation from right

## Verification Results

**Component Implementation:**
- Sheet component verified existing in codebase (shadcn standard)
- UsageDrawer created with proper TypeScript interfaces
- API client integration using existing `@/lib/api-client`

**Integration:**
- API link appears in navbar with proper icon and styling
- Link positioned between Upload Actuals and Alerts
- Opens /docs in new tab
- UsageDrawer ready for integration in admin CRUD pages

## Deviations from Plan

None - plan executed exactly as written. Sheet component already existed in the codebase (standard shadcn implementation), so only UsageDrawer needed creation.

## Success Criteria Met

- [x] API link visible in navbar for all authenticated users
- [x] Link opens Swagger UI in new tab
- [x] UsageDrawer component reusable across admin pages
- [x] Side panel shows project details for referential usage
- [x] Loading state while fetching
- [x] Empty state when no projects use item

## Technical Notes

**API Link Implementation:**
- Uses anchor tag instead of React Router Link (external resource)
- FileJson icon provides clear visual indication
- Positioned before Alerts for logical action grouping

**UsageDrawer Component:**
- Generic design supports all referential types
- Follows shadcn Sheet pattern for consistency
- Error handling with fallback to empty projects array
- Responsive width with overflow scroll for long lists
- Clean project card design with hover effect

**Ready for Integration:**
The UsageDrawer component is now available for integration in all admin CRUD pages (Departments, Teams, Statuses, etc.). Typical usage pattern:

```tsx
const [usageDrawerOpen, setUsageDrawerOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);

// In render:
<UsageDrawer
  referentialType="departments"
  referentialId={selectedItem?.id || 0}
  referentialName={selectedItem?.name || ''}
  open={usageDrawerOpen}
  onOpenChange={setUsageDrawerOpen}
/>
```

## Self-Check: PASSED

**Created files exist:**
- FOUND: frontend/src/components/admin/UsageDrawer.tsx

**Modified files exist:**
- FOUND: frontend/src/components/portfolio/PortfolioHeader.tsx

**Commits exist:**
- FOUND: 27065e43 (Task 1: API docs link)
- FOUND: 9516630b (Task 2: UsageDrawer)

**Component dependencies verified:**
- Sheet component exists in codebase
- apiClient utility exists in @/lib/api-client
- All imports resolve correctly
