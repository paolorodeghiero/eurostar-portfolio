# Phase 2: Core Projects - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable complete project management with multi-dimensional scoring. Users can create, view, edit, stop, and delete projects. Projects have core fields, people assignments, team involvement with effort sizes, value scores across multiple dimensions, and change impact tracking. Budget, actuals, and governance workflows are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Concurrency & Collaboration
- Optimistic locking with version field on projects table
- On save conflict: modal dialog with side-by-side comparison, user chooses which version to keep
- Works for both GUI and API consumers

### Project Form Layout
- Sidebar overlay (~500px wide) slides in from right over portfolio table
- 5 vertical tabs: General, People, Teams, Value, Change Impact
- Sticky header: Project ID, name, status badge, close (X) button, three-dot menu
- Sticky footer: Save status text only ("Saving...", "Saved", "Error: ...")
- No Save/Cancel buttons — auto-save handles everything
- Tab indicators show both completion percentage and error badges

### Auto-Save Behavior
- Auto-save with debounce (2-3 seconds of inactivity)
- Auto-save on close/blur (leaving the sidebar)
- Validation errors block save and show inline
- Status text in footer reflects current state

### Sidebar Interactions
- Escape key closes sidebar (auto-saves first)
- Click outside: if on project row → switch to that project; otherwise → close sidebar
- Both actions auto-save current state first
- Slide animation from right edge

### Create New Project
- Quick modal first: Name + Lead team + Start/End dates
- Project ID auto-generated (PRJ-YYYY-INC format)
- After quick create, full sidebar opens for remaining fields

### Team Selection (Teams & Change Impact tabs)
- Lead team: searchable combobox filtering from Teams referential
- Involved teams: inline chips with T-shirt size badge
- Click chip → dropdown to change size (XS/S/M/L/XL/XXL)
- Size dropdown appears immediately when team is added (no "unset" state)
- Lead team pinned at start with distinct styling, no X button (can't be removed)
- Change Impact tab uses identical chip pattern

### Value Scoring (Value tab)
- Compact cards in a grid, one per outcome
- Collapsed view: dimension name + filled dots (●●●●○ for score 4)
- Click card to expand for editing
- Expanded view: slider (1-5), example text always visible below slider, always-visible textarea for justification
- All outcomes including Regulatory Compliance use 1-5 scoring (not boolean)

### Project Lifecycle
- Stop: no confirmation needed, immediate action
- Stopped state: read-only, visually greyed in table
- Reactivate: available via three-dot menu for stopped projects
- Delete: requires typing project name to confirm
- Delete disabled with tooltip when project has actuals

### Three-Dot Menu Actions
- For active projects: Stop, Delete
- For stopped projects: Reactivate, Delete
- Delete disabled with tooltip if actuals exist

### Claude's Discretion
- Exact spacing, typography, and color choices within Eurostar brand
- Loading skeleton design for sidebar
- Exact debounce timing for auto-save
- Error message wording
- Slider styling details

</decisions>

<specifics>
## Specific Ideas

- Linear-style sidebar overlay that doesn't fully obscure the portfolio table
- Team chips similar to tag inputs in modern apps — type to search, click to configure
- Value scoring cards should feel like a dashboard summary that expands for editing
- Conflict resolution modal should clearly show "Your version" vs "Server version" with timestamps and who made changes

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-core-projects*
*Context gathered: 2026-02-03*
