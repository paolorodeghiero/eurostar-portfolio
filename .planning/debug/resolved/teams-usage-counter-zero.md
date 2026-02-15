---
status: resolved
trigger: "teams-usage-counter-zero - Teams admin page shows usage count of 0 for all teams, but the usage drawer shows projects when clicked"
created: 2026-02-10T00:00:00Z
updated: 2026-02-15T00:00:00Z
resolved: 2026-02-15T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Root cause was double counting (lead + involved) AND string concatenation
test: Verified at /admin/teams - counts now match drawer
expecting: Usage counts match unique project count
next_action: DONE

## Symptoms

expected: Teams usage count should show number of projects using each team (as lead or involved)
actual: Usage count shows 0 for all teams, but clicking "View Usage" shows projects in the drawer
errors: No errors, just count mismatch
reproduction: Go to /admin/teams, see all counts are 0, click "View Usage" on a team that has projects
started: Just fixed related issue in departments, this is in the same codebase

## Eliminated

## Evidence

- timestamp: 2026-02-10T00:01:00Z
  checked: backend/src/routes/admin/teams.ts lines 10-26 (GET / endpoint)
  found: Line 25 has hardcoded `usageCount: 0` with comment "Usage count placeholder (will be projects count in Phase 2)"
  implication: The list endpoint is not calculating actual usage, just returning 0

- timestamp: 2026-02-10T00:01:30Z
  checked: backend/src/routes/admin/teams.ts lines 233-273 (GET /:id/usage endpoint)
  found: This endpoint correctly queries leadProjects (line 243-253) and involvedProjects (line 256-267), then combines them
  implication: The drawer works because it queries the actual data, but the list doesn't

- timestamp: 2026-02-10T00:02:00Z
  checked: backend/src/routes/admin/departments.ts lines 8-24 (GET / endpoint)
  found: Uses Promise.all pattern to count teams.departmentId for each department
  implication: Should use same pattern for teams, but need to count both projects.leadTeamId AND projectTeams.teamId

## Resolution

root_cause: |
  Two bugs:
  1. Double counting - team counted once as lead AND again as involved (projectTeams includes lead team)
  2. String concatenation - sql count returns string, "0" + "0" = "00" not 0
fix: |
  - Use SQL UNION to count unique projects (SELECT id FROM projects WHERE lead_team_id UNION SELECT project_id FROM project_teams WHERE team_id)
  - Convert count to Number() to prevent string concatenation
  - Applied to GET /, GET /:id, DELETE /:id endpoints
verification: User confirmed counts now match drawer at /admin/teams
commit: 74883771
files_changed:
  - backend/src/routes/admin/teams.ts (GET /, GET /:id, DELETE /:id endpoints)
