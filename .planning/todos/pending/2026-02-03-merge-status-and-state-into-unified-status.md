---
created: 2026-02-03T12:15
title: Merge status and state into unified status
area: ui
files:
  - frontend/src/components/projects/ProjectMenu.tsx
  - frontend/src/components/projects/tabs/GeneralTab.tsx
  - backend/src/routes/projects/projects.ts
  - backend/src/db/schema.ts
---

## Problem

The current distinction between "status" (Draft, Ready, On Track, Issues, At Risk, Completed) and "state" (isStopped boolean) is confusing. Users have two separate concepts to manage when they should be unified.

Current behavior:
- Status is selected via dropdown in General tab
- Stop/Reactivate is in the three-dot contextual menu
- isStopped is a separate boolean field

This creates confusion about what "status" means vs "state".

## Solution

Merge into a unified status system:

1. Three special statuses that block editing: **Draft**, **Completed**, **Stopped**
   - Draft: Initial state, editable
   - Completed: Project finished, read-only
   - Stopped: Project halted, read-only (can be reactivated)

2. Remove Stop/Reactivate from contextual menu - status changes happen via the status dropdown in General tab like other statuses

3. When stopped, remember the previous status so reactivating restores it

4. Stopped and Completed both trigger read-only mode (disabled inputs)

5. Remove isStopped boolean field, use status field instead

Changes needed:
- Database: Remove isStopped column, ensure statuses table has Draft/Completed/Stopped
- Backend: Update project routes to handle status-based read-only logic
- Frontend: Remove Stop/Reactivate from ProjectMenu, update GeneralTab status dropdown, update read-only logic to check status instead of isStopped
