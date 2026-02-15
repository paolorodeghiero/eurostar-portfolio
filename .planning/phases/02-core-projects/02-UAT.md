---
status: testing
phase: 02-core-projects
source: 02-01 through 02-10 SUMMARY.md files
started: 2026-02-03T12:00:00Z
updated: 2026-02-03T12:00:00Z
---

## Current Test

number: 4
name: People Tab - Autocomplete Fields
expected: |
  In People tab, you can type to search and select Project Manager, IS Owner, and Sponsor. Each field shows suggestions based on previous values.
awaiting: user response

## Tests

### 1. Create New Project
expected: Click "New Project" button on portfolio page. Dialog opens with name and lead team fields. After filling both and clicking Create, sidebar opens showing the new project with ID in PRJ-2026-XXXXX format.
result: pass

### 2. Portfolio Table Shows Projects
expected: Portfolio page displays all projects in a table with columns for ID, Name, Lead Team, Status. Clicking a row opens that project in the sidebar.
result: pass

### 3. General Tab - Edit Core Fields
expected: In General tab, you can edit project name, status (dropdown with color dots), start date, end date, and lead team. Changes show "Saving..." then "Saved" status in footer.
result: pass

### 4. People Tab - Autocomplete Fields
expected: In People tab, you can type to search and select Project Manager, IS Owner, and Sponsor. Each field shows suggestions based on previous values.
result: [pending]

### 5. Teams Tab - Add Team
expected: In Teams tab, click "Add Team" button. A searchable dropdown appears. Select a team and it appears as a chip with default M size.
result: [pending]

### 6. Teams Tab - Lead Team Display
expected: Lead team shows with teal styling and "Lead" badge. Lead team cannot be removed (no X button).
result: [pending]

### 7. Teams Tab - Change Team Size
expected: Click the size badge (e.g., "M") on any team chip. Dropdown appears with XS/S/M/L/XL/XXL options. Selecting a new size updates immediately.
result: [pending]

### 8. Teams Tab - Remove Team
expected: Click X button on a non-lead team chip. Team is removed from the list immediately.
result: [pending]

### 9. Value Tab - Score Cards
expected: Value tab shows cards for each outcome (Punctuality, People Engagement, EBITDA, NPS, Safety). Each card shows filled/empty dots indicating current score (1-5).
result: [pending]

### 10. Value Tab - Expand Card and Score
expected: Click a value card to expand it. Slider appears (1-5), example text shows for current score, and justification textarea is available. Moving slider updates score dots.
result: [pending]

### 11. Change Impact Tab - Add Impact Team
expected: In Change Impact tab, click "Add Team" button. Select a team from dropdown. Team appears as chip with size badge.
result: [pending]

### 12. Change Impact Tab - Modify Impact Team
expected: Change size on impact team chip using dropdown. Remove impact team by clicking X button. Both actions work immediately.
result: [pending]

### 13. Auto-Save Persistence
expected: Make changes in any tab, see "Saved" status. Close sidebar, reopen same project. All changes are still there.
result: [pending]

### 14. Stop Project Action
expected: Click three-dot menu in sidebar header, select "Stop Project". Project shows "Stopped" badge. All form fields become disabled (read-only).
result: [pending]

### 15. Reactivate Project
expected: On a stopped project, click three-dot menu and select "Reactivate". "Stopped" badge disappears. Form fields become editable again.
result: [pending]

### 16. Delete Project
expected: Click three-dot menu, select "Delete Project". Confirmation dialog appears requiring you to type the exact project name. After correct input, project is deleted and sidebar closes.
result: [pending]

### 17. Conflict Resolution Dialog
expected: Open same project in two browser windows. Edit name in window 1, wait for save. Edit name in window 2, wait for auto-save. Window 2 shows conflict dialog with side-by-side comparison of your version vs server version. Can choose "Keep My Version" or "Keep Server Version".
result: [pending]

## Summary

total: 17
passed: 3
issues: 0
pending: 14
skipped: 0

## Gaps

[none yet]
