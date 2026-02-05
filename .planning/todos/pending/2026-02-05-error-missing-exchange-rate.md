---
created: 2026-02-05T17:30
title: Add error when missing exchange rate for period
area: api
files:
  - backend/src/lib/currency-converter.ts
  - backend/src/routes/projects/projects.ts
  - backend/src/routes/projects/project-budget.ts
---

## Problem

When converting currencies for budget/receipts/invoices, if no exchange rate exists for the required period, the conversion silently fails and falls back to using unconverted amounts. This can lead to incorrect totals displayed to users without any warning.

Current behavior:
- `convertCurrency` throws an error when rate not found
- Calling code catches error and uses original amount
- User sees wrong values with no indication of the problem

Users need to be warned when exchange rates are missing so they can add the appropriate rates before relying on the converted values.

## Solution

TBD - Options to consider:
1. Return a warning flag in API responses when conversions fail
2. Show a warning banner in the UI when rates are missing
3. Validate exchange rate coverage before displaying converted values
4. Add an admin alert for missing exchange rates
