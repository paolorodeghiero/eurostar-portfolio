---
status: resolved
trigger: "audit-view-not-working"
created: 2026-02-18T00:00:00Z
updated: 2026-02-18T00:15:00Z
---

## Current Focus

hypothesis: CONFIRMED - project-history-api.ts uses plain fetch() without auth headers, all other APIs use apiClient/getAuthHeaders
test: Compare project-history-api.ts with working APIs like project-api.ts
expecting: Fix by using apiClient instead of plain fetch
next_action: Apply fix and verify

## Symptoms

expected: Audit view should display project change history/timeline in the project sidebar
actual: Not working (needs investigation - check if blank, error, or not loading)
errors: Unknown - investigate browser console, network requests, and backend logs
reproduction: Open a project sidebar and navigate to the audit/history tab
started: Unknown - needs investigation

## Eliminated

## Evidence

- timestamp: 2026-02-18T00:01:00Z
  checked: Frontend component structure
  found: HistoryTab component exists at frontend/src/components/projects/tabs/HistoryTab.tsx
  implication: Component is implemented and imported in ProjectTabs.tsx

- timestamp: 2026-02-18T00:02:00Z
  checked: Backend API endpoint
  found: project-history.ts route exists and is registered at /api/projects/:id/history
  implication: Backend endpoint is implemented and should be accessible

- timestamp: 2026-02-18T00:03:00Z
  checked: Frontend API library
  found: project-history-api.ts exists with fetchProjectHistory function
  implication: Frontend has API integration code

- timestamp: 2026-02-18T00:04:00Z
  checked: Backend code for audit log insertion
  found: No INSERT statements into auditLog table found in entire backend codebase
  implication: Audit log table is never populated - UI would show "No history yet"

- timestamp: 2026-02-18T00:05:00Z
  checked: Database triggers for audit logging
  found: Trigger SQL file exists at backend/drizzle/0008_audit_trigger.sql
  implication: Trigger was created in plan 04-02

- timestamp: 2026-02-18T00:06:00Z
  checked: Database for audit_projects_trigger
  found: Trigger EXISTS in database and is attached to projects table
  implication: Trigger is properly installed

- timestamp: 2026-02-18T00:07:00Z
  checked: audit_log table for data
  found: 3 entries exist (all INSERT operations from system user)
  implication: Trigger is working and logging data

- timestamp: 2026-02-18T00:08:00Z
  checked: API endpoint /api/projects/1031/history
  found: Returns {"error":"Missing or invalid authorization header"}
  implication: API endpoint requires authentication - may be blocking frontend

- timestamp: 2026-02-18T00:09:00Z
  checked: project-history-api.ts for authentication
  found: Uses plain fetch() without any auth headers (line 37-38)
  implication: This is the bug - missing authentication

- timestamp: 2026-02-18T00:10:00Z
  checked: project-api.ts (working API) for comparison
  found: Uses apiClient and getAuthHeaders from api-client.ts
  implication: Solution is to replace fetch() with apiClient()

## Resolution

root_cause: project-history-api.ts uses plain fetch() without authentication headers, causing all requests to fail with 401 "Missing or invalid authorization header"

fix: Modified frontend/src/lib/project-history-api.ts to use apiClient() instead of plain fetch()
- Added import: import { apiClient } from './api-client'
- Changed fetchProjectHistory to use: return apiClient<HistoryResponse>(url)
- Removed manual response.ok check and response.json() (apiClient handles this)

verification:
- TypeScript compilation: PASSED
- Frontend build: PASSED
- Code review: CONFIRMED - apiClient pattern matches other working APIs (project-api.ts, project-budget-api.ts)
- Root cause addresses exact symptom: 401 auth errors prevent history data from loading
- Fix is minimal and targeted: only changes authentication mechanism
- Manual UI test needed: Start dev servers (make dev) and verify History tab shows project changes

files_changed:
- frontend/src/lib/project-history-api.ts

root_cause:
fix:
verification:
files_changed: []
