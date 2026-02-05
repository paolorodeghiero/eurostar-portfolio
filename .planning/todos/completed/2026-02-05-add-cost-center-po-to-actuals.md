---
created: 2026-02-05T17:35
title: Add cost center and purchase order to receipts and invoices
area: database
files:
  - backend/src/db/schema.ts
  - backend/src/routes/actuals/receipts.ts
  - backend/src/routes/actuals/invoices.ts
  - frontend/src/components/projects/ActualsTable.tsx
---

## Problem

Receipts and invoices currently lack cost center and purchase order fields. These are important for financial tracking and reconciliation with the accounting system.

Fields to add:
- Cost center (reference to cost_centers table)
- Purchase order number (text field)

Both fields should be:
- Optional (nullable)
- Included in Excel import templates
- Displayed in actuals table
- Exportable to Excel

## Solution

TBD - Database migration to add columns, update API endpoints, update import/export, update UI table.
