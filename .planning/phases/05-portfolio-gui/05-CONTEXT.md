# Phase 5: Portfolio GUI - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the main portfolio user interface: a configurable data table showing all projects with aggregate indicators, global search, column-level filtering, sorting, and a sidebar overlay for full project detail editing. Includes a branded top bar with navigation, alerts, and key actions.

The portfolio page is the home route (/). Admin GUI is Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Table layout & columns
- Default view: full (8-10 columns) — ProjectId, Name, Status, Lead Team, PM, Value Score, Effort, Budget Health, Committee, Actuals
- Aggregate indicators use mini visualizations in cells (not text/badges)
  - Budget health: thin horizontal progress bar (green/orange/red matching existing thresholds)
  - Value score: 5 filled/empty dots (reuse existing score dots pattern)
  - Effort: team tags with T-shirt badges (reuse existing TeamChip)
  - Committee: step indicator
- Column show/hide via column picker dropdown button
- Column reorder via drag-and-drop on headers, persisted to localStorage
- Row density toggle: comfortable (~15 rows visible) and compact (~25 rows visible), user switchable
- Checkbox selection on rows for bulk actions (export, status change)
- Virtual scroll for smooth performance (no pagination)

### Filtering & search
- Global search bar in top bar area, searches ALL text fields and categories (names, IDs, teams, departments, people, justifications)
- Live filtering as you type with ~300ms debounce
- Column-level filters via click on column header (opens filter popover)
- Smart filter types per column: dropdown for status/team, text input for name, date range presets for dates, numeric range for budget
- Date filter presets: "This month", "This quarter", "Overdue", plus custom range
- Active filters displayed as removable chips above table
- Row count shown at top of table near search/filter area: "Showing X of Y projects"
- Saved filter presets: deferred to later phase

### Sorting
- Multi-column sort: Shift+click to add secondary sort columns, with numbered indicators
- Default sort: Project ID descending (newest first)
- Sort/filter state persisted to localStorage across sessions

### Sidebar behavior
- Sidebar takes full right half of screen (50% width)
- Slides in from right with smooth animation
- Clicking different table row while sidebar is open instantly switches to that project
- Tab order: fixed as built (General > People > Teams > Value > Change Impact > Committee > Budget > Actuals > History)
- Auto-save with existing 2500ms debounce (no change from current implementation)
- Sticky header and action buttons: keep as currently implemented
- No keyboard shortcuts (mouse/touch only)
- Escape to close: not needed

### Top bar & navigation
- Minimal top bar: Eurostar logo, Upload Actuals button, Alerts bell dropdown, Admin link, User identity
- Teal background (#006B6B) with white text/icons
- Sticky (fixed at top when table scrolls)
- Logo links to portfolio home (/)
- Admin link/icon navigates to /admin
- User identity: initials circle + name from EntraID token
- "New Project" button lives above the table (not in top bar), opens modal dialog with essential fields, then opens sidebar for full editing
- Upload Actuals stays in top bar as existing

### Claude's Discretion
- Exact animation timing and easing for sidebar
- Loading skeleton design for table
- Error states and empty table state messaging
- Bulk action UI for checkbox selection (toolbar that appears when rows selected)
- Exact column picker dropdown design
- Row hover/highlight styling

</decisions>

<specifics>
## Specific Ideas

- Mini visualizations should feel like Linear's table — compact, information-dense but clean
- The table should feel snappy and responsive even with many columns
- Score dots reuse the existing pattern from the Value tab (primary color filled, gray empty)
- TeamChip components reuse existing teal styling for lead team distinction
- Progress bars for budget health reuse existing color coding: green < 90%, orange 90-100%, red > 100%

</specifics>

<deferred>
## Deferred Ideas

- Saved filter presets — future enhancement
- Keyboard shortcuts for sidebar navigation — not needed for v1
- Export to Excel from portfolio table — consider for Phase 6 or quick task

</deferred>

---

*Phase: 05-portfolio-gui*
*Context gathered: 2026-02-09*
