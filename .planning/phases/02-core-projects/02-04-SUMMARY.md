---
phase: 02-core-projects
plan: 04
subsystem: backend-api
tags: [fastify, drizzle, rest-api, crud, teams, values, change-impact]
dependency_graph:
  requires: [02-01]
  provides: [project-teams-api, project-values-api, project-change-impact-api]
  affects: [02-05, 02-07]
tech_stack:
  added: []
  patterns: [upsert-pattern, t-shirt-size-validation]
key_files:
  created:
    - backend/src/routes/projects/project-teams.ts
    - backend/src/routes/projects/project-values.ts
    - backend/src/routes/projects/project-change-impact.ts
  modified:
    - backend/src/routes/projects/index.ts
decisions: []
metrics:
  duration: 3m
  completed: 2026-02-03
---

# Phase 2 Plan 4: Project Sub-Resource APIs Summary

Project teams/values/change-impact REST APIs with T-shirt size validation and lead team protection.

## What Was Built

Created three Fastify route modules for project sub-resources:

1. **Project Teams Routes** (`project-teams.ts`)
   - GET `/api/projects/:projectId/teams` - List involved teams with team/department details
   - POST `/api/projects/:projectId/teams` - Add team with effort size
   - PUT `/api/projects/:projectId/teams/:teamId` - Update effort size
   - DELETE `/api/projects/:projectId/teams/:teamId` - Remove team (blocked for lead)

2. **Project Values Routes** (`project-values.ts`)
   - GET `/api/projects/:projectId/values` - List value scores with outcome details
   - PUT `/api/projects/:projectId/values/:outcomeId` - Upsert score (1-5)
   - DELETE `/api/projects/:projectId/values/:outcomeId` - Remove score

3. **Change Impact Routes** (`project-change-impact.ts`)
   - GET `/api/projects/:projectId/change-impact` - List impact teams
   - POST `/api/projects/:projectId/change-impact` - Add impact team
   - PUT `/api/projects/:projectId/change-impact/:teamId` - Update impact size
   - DELETE `/api/projects/:projectId/change-impact/:teamId` - Remove entry

## Key Implementation Details

### T-shirt Size Validation
```typescript
const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
if (!TSHIRT_SIZES.includes(effortSize as TshirtSize)) {
  return reply.code(400).send({ error: 'Invalid effort size' });
}
```

### Lead Team Protection
```typescript
if (teamAssignment.isLead) {
  return reply.code(400).send({
    error: 'Cannot remove lead team',
    message: 'The lead team cannot be removed from involved teams',
  });
}
```

### Value Score Upsert Pattern
```typescript
await db
  .insert(projectValues)
  .values({ projectId, outcomeId, score, justification })
  .onConflictDoUpdate({
    target: [projectValues.projectId, projectValues.outcomeId],
    set: { score, justification, updatedAt: new Date() },
  });
```

### Score Validation
```typescript
if (score < 1 || score > 5 || !Number.isInteger(score)) {
  return reply.code(400).send({
    error: 'Invalid score',
    message: 'Score must be an integer between 1 and 5',
  });
}
```

## Commits

| Hash | Type | Description |
|------|------|-------------|
| edf0026 | feat | Project teams routes with lead protection |
| c799b0f | feat | Project values routes with upsert pattern |
| 5776041 | feat | Change impact routes and index registration |

## Deviations from Plan

None - plan executed exactly as written.

## Files Changed

| File | Change | Lines |
|------|--------|-------|
| backend/src/routes/projects/project-teams.ts | created | +234 |
| backend/src/routes/projects/project-values.ts | created | +161 |
| backend/src/routes/projects/project-change-impact.ts | created | +222 |
| backend/src/routes/projects/index.ts | modified | +6/-1 |

## Verification Results

- All files compile without TypeScript errors
- Routes registered in index.ts correctly
- T-shirt size validation enforced on all relevant endpoints
- Score validation rejects invalid values (0, 6, non-integers)
- Lead team cannot be removed from involved teams (400 error)

## Next Phase Readiness

Ready for:
- 02-05: Frontend project form tabs (Teams, Value, Change Impact)
- 02-07: Integration with main project CRUD

All APIs follow consistent patterns:
- 404 for project/team/outcome not found
- 400 for validation errors
- 409 for duplicate entries
- Joins include related entity details (team name, department, outcome examples)
