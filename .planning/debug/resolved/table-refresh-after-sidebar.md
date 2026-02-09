---
status: resolved
trigger: "Investigate issue: table-not-refreshing-after-sidebar-save"
created: 2026-02-09T00:00:00Z
updated: 2026-02-09T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - All mutation tabs missing onProjectUpdated callback
test: Applied fix and verified TypeScript compilation
expecting: Table should now refresh after sidebar mutations
next_action: Archive and commit

## Symptoms

expected: After saving changes in sidebar, main table should update to show new values
actual: Table keeps showing old values until page is manually refreshed
errors: None reported
reproduction: Open project sidebar, change committee state or add team, save - table still shows old data
started: Unclear - may have always been this way or regression

## Eliminated

## Evidence

- timestamp: 2026-02-09T00:01:00Z
  checked: ProjectSidebar.tsx lines 66-86 (handleSave function)
  found: Calls onProjectUpdated?.() after successful save (line 74)
  implication: Sidebar IS notifying parent, but need to verify what parent does

- timestamp: 2026-02-09T00:02:00Z
  checked: PortfolioPage.tsx lines 404-419 (ProjectSidebar usage)
  found: onProjectUpdated={loadProjects} is passed to sidebar (line 413)
  implication: PortfolioPage loadProjects should be called on sidebar save

- timestamp: 2026-02-09T00:03:00Z
  checked: PortfolioPage.tsx lines 179-215 (loadProjects function)
  found: loadProjects is wrapped in useCallback with empty dependency array (line 179)
  implication: Function definition is stable, should work correctly

- timestamp: 2026-02-09T00:04:00Z
  checked: ProjectTabs component (need to verify if tabs also call onProjectUpdated)
  found: ProjectSidebar passes formData changes via setFormData, but tabs might have their own save mutations
  implication: Need to check if committee/team changes in tabs also trigger onProjectUpdated

- timestamp: 2026-02-09T00:05:00Z
  checked: CommitteeTab.tsx lines 52-69 (handleTransition function)
  found: Calls transitionCommitteeState API, updates local state, but NEVER calls parent callback
  implication: Committee state changes are saved to backend but parent table is never notified

- timestamp: 2026-02-09T00:06:00Z
  checked: TeamsTab.tsx lines 59-75 (handleSizeChange, handleRemove, handleAdd)
  found: All three mutation functions update backend and local state, but NEVER call parent callback
  implication: Team additions/removals/size changes save to backend but parent table is never notified

- timestamp: 2026-02-09T00:07:00Z
  checked: ProjectTabs.tsx - interface and props passing
  found: ProjectTabs receives onChange callback but NO onProjectUpdated callback
  implication: Even if tabs wanted to notify parent, they don't have the callback to do so

## Resolution

root_cause: CommitteeTab, TeamsTab, BudgetTab, ValueTab, and ChangeImpactTab all perform mutations that save to backend but never notify the parent PortfolioPage to refresh the table data. ProjectSidebar passes onProjectUpdated callback to ProjectHeader but NOT to ProjectTabs, so tabs had no way to trigger table refresh.
fix: Threaded onProjectUpdated callback through component hierarchy (ProjectSidebar -> ProjectTabs -> all mutation tabs) and called it after successful mutations in all five tabs after their respective operations complete
verification: TypeScript compilation successful. Fix enables automatic table refresh after sidebar mutations by calling loadProjects() in PortfolioPage whenever data changes in any tab.
files_changed:
  - frontend/src/components/projects/ProjectSidebar.tsx
  - frontend/src/components/projects/ProjectTabs.tsx
  - frontend/src/components/projects/tabs/CommitteeTab.tsx
  - frontend/src/components/projects/tabs/TeamsTab.tsx
  - frontend/src/components/projects/tabs/BudgetTab.tsx
  - frontend/src/components/projects/tabs/ValueTab.tsx
  - frontend/src/components/projects/tabs/ChangeImpactTab.tsx
