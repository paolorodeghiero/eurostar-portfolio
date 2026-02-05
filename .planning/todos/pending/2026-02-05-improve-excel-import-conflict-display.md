---
created: 2026-02-05T12:00
title: Improve Excel import conflict display
area: ui
files:
  - frontend/src/components/admin/BudgetLinesPage.tsx
  - frontend/src/components/projects/ImportActualsDialog.tsx
---

## Problem

When importing Excel files (budget lines or actuals), if there are duplicate/conflict records, the current error handling doesn't provide useful feedback about which specific records are conflicting.

Users need to:
1. See the count of conflicts detected
2. See the first 10 conflicting keys to quickly identify the issue
3. If more than 10 conflicts, have a "Copy all" button to export the full list for pasting into Excel for review

## Solution

- Backend: Return structured conflict data with keys of conflicting records
- Frontend: Display count, show first 10 in the error dialog
- Add "Copy to clipboard" button when conflicts > 10 that formats as tab-separated values for Excel paste
