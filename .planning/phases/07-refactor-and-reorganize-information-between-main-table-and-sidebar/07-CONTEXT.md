# Phase 7: Refactor and Reorganize Information Between Main Table and Sidebar - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Restructure what data appears in the portfolio table versus the sidebar. Redesign table column visualizations (radar chart, progress bars, expandable rows), reorganize sidebar tabs (merge People into General, rename Teams to Effort, move business case to General), add new fields (description, global effort T-shirt), fix the currency storage model, and optimize the backend API to support the new data requirements.

</domain>

<decisions>
## Implementation Decisions

### Table column redesign
- **Value score**: Replace 5 dots with a static mini radar/spider chart showing all 5 dimensions at a glance
- **Effort**: Show aggregate project T-shirt size (auto-derived from team sizes). Click to expand row showing full team breakdown with individual T-shirts
- **Change Impact**: Show as T-shirt summary in table. Click to expand row showing impact team breakdown (same pattern as effort)
- **Budget health**: Keep progress bar but add 'spent/total' text (e.g., "EUR 45K / EUR 100K") with color coding
- **Committee**: Show level (Mandatory/Optional) + small progression line showing workflow steps + current state text on the right
- **Status**: Keep colored badge (current design)
- **Last activity**: Add column showing relative time ("2h ago", "yesterday", "3 days ago")

### New table columns
- **Date range**: Single column showing "Jan 2026 - Jun 2026" (start - end combined)
- **Cost T-shirt**: Show XS/S/M/L/XL/XXL badge
- **IS Owner**: Add to table
- **Sponsor**: Add to table
- **Impact**: T-shirt summary (expandable like effort)

### Table layout
- Default visible columns (Core 8): ID, Name, Status, Lead Team, Dates, Value, Budget, Committee
- Hidden by default: PM, IS Owner, Sponsor, Effort, Impact, Cost T-shirt, Last Activity, Stopped
- Frozen columns on horizontal scroll: Checkbox + ID + Name (first 3)
- Smart defaults + horizontal scroll for wide tables
- Expandable sub-rows for Effort and Change Impact cells (click to expand inline)

### Sidebar tab changes
- **Merge People into General**: General tab now has sections with dividers:
  1. "Core Info" section: Name, Status, Dates, Lead Team
  2. "People" section: PM, IS Owner, Sponsor
  3. "Description" section: Rich text editor (new field)
  4. "Business Case" section: File upload/download (moved from Committee tab)
- **Rename "Teams" tab to "Effort"**: Display global project effort T-shirt at top (auto-derived from team sizes), then involved teams list below
- **Value tab**: Display larger, detailed radar chart at top with dimension labels visible, then individual score cards below
- **Budget tab**: OPEX and CAPEX always visible as two side-by-side cards at top with Edit button, then allocations table below
- **Committee tab**: Remove business case (moved to General), show only governance state machine and transitions
- **People tab**: Removed (merged into General)
- No other tab changes. Keep current tab order (General > Effort > Value > Change Impact > Committee > Budget > Actuals > History)
- Default tab on open: General (always)

### Currency model fix
- ALL monetary amounts stored in EUR in the database (always)
- The GBP/EUR toggle is a project-level display preference only
- When user types a value in GBP mode, it is converted to EUR before saving to database
- When displaying in GBP mode, EUR values are converted to GBP for display
- Changing the toggle does NOT create an audit history record (it's cosmetic, no data change)
- reportCurrency field stores the preference but has no effect on stored values

### API optimization
- Optimize existing /api/projects list endpoint (no new endpoint)
- Ensure list endpoint returns: teams, valueScoreAvg, budgetTotal, actualsTotal, committeeState, committeeLevel, costTshirt, opexBudget, capexBudget, startDate, endDate, isOwner, sponsor, updatedAt
- Add project description field to database schema and API
- Ensure currency conversion happens at API boundary (store EUR, return requested currency)

### Claude's Discretion
- Radar chart library choice (recharts, visx, or custom SVG)
- Exact expandable row animation and styling
- Global effort T-shirt derivation algorithm (max of teams, weighted average, etc.)
- Rich text editor library choice
- Exact section divider styling in General tab
- Committee progression line visual design

</decisions>

<specifics>
## Specific Ideas

- Radar chart should be small enough for table cells (~40px) but large enough in sidebar Value tab to show dimension labels (Punctuality, NPS, EBITDA, People Engagement, Safety)
- Expandable rows should feel like Notion's toggle rows — smooth inline expansion
- Budget cards (OPEX/CAPEX) should show amounts with proper currency formatting
- The currency fix is critical — current implementation stores in source currency which is wrong. Must convert to EUR on save.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-refactor-and-reorganize-information-between-main-table-and-sidebar*
*Context gathered: 2026-02-09*
