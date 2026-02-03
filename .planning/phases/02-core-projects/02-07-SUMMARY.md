---
phase: 02-core-projects
plan: 07
subsystem: project-ui
tags: [teams, chips, t-shirt-sizes, frontend]
depends_on:
  requires: [02-04, 02-05]
  provides: [teams-tab, team-chip-component]
  affects: [02-08, 02-09]
tech-stack:
  added: []
  patterns: [chip-based-team-selection, command-popover-search]
key-files:
  created:
    - frontend/src/components/projects/TeamChip.tsx
    - frontend/src/components/projects/tabs/TeamsTab.tsx
  modified:
    - frontend/src/lib/project-api.ts
    - frontend/src/components/projects/ProjectTabs.tsx
decisions: []
metrics:
  duration: 6m
  completed: 2026-02-03
---

# Phase 2 Plan 7: Teams Tab Summary

**One-liner:** Chip-based team management with T-shirt sizes and searchable add dropdown

## What Was Built

### Team API Functions (frontend/src/lib/project-api.ts)
Added four team management functions:
- `fetchProjectTeams(projectId)` - Get all teams for a project
- `addProjectTeam(projectId, teamId, effortSize)` - Add team with effort size
- `updateProjectTeamSize(projectId, teamId, effortSize)` - Change team's T-shirt size
- `removeProjectTeam(projectId, teamId)` - Remove team from project

### TeamChip Component (frontend/src/components/projects/TeamChip.tsx)
Reusable chip component for displaying a team:
- Team name with size badge
- Lead teams have teal styling and "Lead" badge
- Size badge opens dropdown menu with T-shirt sizes (XS/S/M/L/XL/XXL)
- Non-lead teams show X button for removal
- Uses eurostar-teal color from CSS variables

### TeamsTab Component (frontend/src/components/projects/tabs/TeamsTab.tsx)
Full-featured team management tab:
- Lists all project teams as chips (lead team first, then alphabetical)
- "Add Team" button opens Command/Popover with searchable dropdown
- Filters out already-assigned teams from add list
- Size changes persist immediately via API
- Removes teams with confirmation-less delete
- Shows T-shirt size legend at bottom

### ProjectTabs Integration
- TeamsTab wired into ProjectTabs component
- Receives projectId prop to load and manage teams

## Key Implementation Details

```typescript
// TeamChip with conditional lead styling
<div className={cn(
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm',
  isLead
    ? 'bg-eurostar-teal/10 border-eurostar-teal text-eurostar-teal'
    : 'bg-background border-border'
)}>
```

```typescript
// Add Team uses Command + Popover pattern
<Popover open={addOpen} onOpenChange={setAddOpen}>
  <PopoverTrigger asChild>
    <Button variant="outline" size="sm">
      <Plus className="h-4 w-4 mr-1" />
      Add Team
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-[250px] p-0" align="end">
    <Command>
      <CommandInput placeholder="Search teams..." />
      ...
    </Command>
  </PopoverContent>
</Popover>
```

## Deviations from Plan

None - plan executed exactly as written.

## Verification Checklist

- [x] Teams tab shows all involved teams as chips
- [x] Lead team has "Lead" badge and teal styling
- [x] Lead team has no X button (can't remove)
- [x] Other teams have X button to remove
- [x] Clicking size badge opens dropdown with XS-XXL options
- [x] Add Team button shows searchable list of available teams
- [x] Adding team creates chip with default M size
- [x] Size changes persist via API

## Commits

| Hash | Message |
|------|---------|
| aa90233 | feat(02-07): add team API functions |
| 45a3462 | feat(02-07): create TeamChip component |
| 65c18a7 | feat(02-07): create TeamsTab with chip-based team management |

## Next Phase Readiness

Ready for:
- 02-08: Value tab implementation
- 02-09: Change Impact tab (similar chip pattern can be reused)
