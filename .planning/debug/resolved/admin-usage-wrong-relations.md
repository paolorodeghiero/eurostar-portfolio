---
status: resolved
trigger: "admin-usage-wrong-relations"
created: 2026-02-10T00:00:00Z
updated: 2026-02-10T00:08:00Z
symptoms_prefilled: true
goal: find_and_fix
---

## Current Focus

hypothesis: ROOT CAUSE CONFIRMED - Multiple usage endpoints return wrong relations
test: Fix departments to return teams, outcomes to return projectValues, and cost-centers to return only budgetLines
expecting: Usage drawer will show correct direct children per data model
next_action: Fix the three problematic endpoints

## Symptoms

expected: Departments usage should show teams (departments → teams is the direct FK relation). Each referential should show its direct children, not grandchildren.
actual: Departments usage shows projects instead of teams. This skips the intermediate relation.
errors: No errors, just wrong data structure
reproduction: Go to /admin/departments, click "View Usage" on any department
started: Implemented in Phase 6 (06-03 and 06-05)

## Eliminated

## Evidence

- timestamp: 2026-02-10T00:01:00Z
  checked: backend/src/routes/admin/departments.ts GET /:id/usage endpoint (lines 175-198)
  found: |
    The endpoint queries projects via a JOIN through teams:
    ```
    .from(projects)
    .innerJoin(teams, eq(projects.leadTeamId, teams.id))
    .where(eq(teams.departmentId, id))
    ```
    Returns { projects: projectsList } instead of teams
  implication: This confirms the bug - it skips teams and goes directly to projects, violating the direct FK relationship rule

- timestamp: 2026-02-10T00:02:00Z
  checked: backend/src/routes/admin/teams.ts GET /:id/usage endpoint (lines 233-273)
  found: |
    CORRECT! Returns projects (direct child relation):
    - teams.id is referenced by projects.leadTeamId
    - teams.id is referenced by projectTeams.teamId
    Returns { projects: allProjects }
  implication: Teams usage is correctly implemented

- timestamp: 2026-02-10T00:03:00Z
  checked: backend/src/routes/admin/statuses.ts GET /:id/usage endpoint (lines 78-98)
  found: |
    CORRECT! Returns projects (direct child relation):
    - statuses.id is referenced by projects.statusId
    Returns { projects: projectsList }
  implication: Statuses usage is correctly implemented

- timestamp: 2026-02-10T00:04:00Z
  checked: backend/src/routes/admin/outcomes.ts GET /:id/usage endpoint (lines 187-209)
  found: |
    WRONG! Returns projects instead of projectValues:
    - outcomes.id is referenced by projectValues.outcomeId (direct child)
    - But endpoint returns projects via JOIN through projectValues
    Returns { projects: projectsList }
  implication: Outcomes has the same bug as departments - skips the direct child

- timestamp: 2026-02-10T00:05:00Z
  checked: backend/src/routes/admin/cost-centers.ts GET /:id/usage endpoint (lines 166-229)
  found: |
    PARTIALLY WRONG! Returns both budgetLines (correct) AND projects (wrong):
    - costCenters.id is referenced by budgetLines.costCenterId (direct child)
    - But also returns projects via JOIN through budgetLines → projectBudgetAllocations
    Returns { budgetLines: budgetLinesList, projects: projectsList }
  implication: Cost centers returns the correct direct child (budgetLines) but also adds grandchildren (projects)

## Resolution

root_cause: |
  Three usage endpoints return wrong relations, skipping direct FK children:

  1. departments/:id/usage returns projects instead of teams
     - Correct: departments.id → teams.departmentId (direct FK)
     - Wrong: Joins through teams to get projects (grandchildren)

  2. outcomes/:id/usage returns projects instead of projectValues
     - Correct: outcomes.id → projectValues.outcomeId (direct FK)
     - Wrong: Joins through projectValues to get projects (grandchildren)

  3. cost-centers/:id/usage returns projects in addition to budgetLines
     - Correct: costCenters.id → budgetLines.costCenterId (direct FK)
     - Wrong: Also joins through budgetLines → projectBudgetAllocations to get projects

  The pattern suggests these were written to provide "useful" project-level information,
  but violated the data model hierarchy principle.

fix: |
  Fixed all three endpoints to return direct FK children:

  1. departments.ts: Changed to return teams instead of projects
     - Query now returns teams.id, teams.name, teams.description
     - Response: { teams: teamsList }

  2. outcomes.ts: Changed to return projectValues instead of projects
     - Query now returns projectValues.id, projectValues.projectId, projectValues.score
     - Response: { projectValues: valuesList }

  3. cost-centers.ts: Removed projects, now returns only budgetLines
     - Query now returns only budgetLines with their details
     - Response: { budgetLines: budgetLinesList }

  4. UsageDrawer.tsx: Made flexible to handle different entity types
     - Added interfaces for TeamUsage, BudgetLineUsage, ProjectValueUsage
     - Added getUsageInfo() to determine entity type from response
     - Added renderItem() with type-specific rendering for each entity
     - Updated title and descriptions to be generic

verification: |
  1. Schema verification (backend/src/db/schema.ts):
     - teams.departmentId references departments.id ✓
     - projectValues.outcomeId references outcomes.id ✓
     - budgetLines.costCenterId references costCenters.id ✓
     All FK relationships match the fix

  2. Backend compilation: npm run build passes ✓

  3. Code review of fixes:
     - departments/:id/usage now returns teams with id, name, description ✓
     - outcomes/:id/usage now returns projectValues with id, projectId, score ✓
     - cost-centers/:id/usage now returns only budgetLines (removed projects) ✓
     - UsageDrawer.tsx handles all entity types dynamically ✓

  4. Logic verification:
     - Each endpoint queries the direct FK child table only
     - No JOINs to grandchildren tables
     - Response structure matches the direct child entity
     - UsageDrawer renders appropriate fields for each type

  Fix verified against data model and compiles successfully.
files_changed:
  - backend/src/routes/admin/departments.ts
  - backend/src/routes/admin/outcomes.ts
  - backend/src/routes/admin/cost-centers.ts
  - frontend/src/components/admin/UsageDrawer.tsx
