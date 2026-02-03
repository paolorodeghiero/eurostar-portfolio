---
phase: 01-foundation-authentication
plan: 04
subsystem: backend-api
tags: [fastify, drizzle, crud, admin, referentials]

dependency-graph:
  requires: ["01-01", "01-02"]
  provides: ["admin-referentials-api", "require-admin-middleware", "db-plugin"]
  affects: ["02-*"]

tech-stack:
  added: []
  patterns: ["fastify-plugins", "drizzle-crud", "admin-middleware", "usage-tracking"]

key-files:
  created:
    - backend/src/middleware/require-admin.ts
    - backend/src/plugins/db.ts
    - backend/src/routes/admin/referentials.ts
    - backend/src/routes/admin/departments.ts
    - backend/src/routes/admin/teams.ts
    - backend/src/routes/admin/statuses.ts
    - backend/src/routes/admin/outcomes.ts
    - backend/src/routes/admin/cost-centers.ts
    - backend/src/routes/admin/currency-rates.ts
    - backend/src/routes/admin/committee-thresholds.ts
    - backend/src/routes/admin/cost-tshirt-thresholds.ts
    - backend/src/routes/admin/competence-month-patterns.ts
  modified:
    - backend/src/server.ts
    - backend/src/types/fastify.d.ts

decisions:
  - id: dec-01-04-1
    choice: "Created db plugin to attach drizzle to Fastify instance"
    reason: "Enables route handlers to access db via fastify.db pattern"
  - id: dec-01-04-2
    choice: "Usage counts return 0 placeholder for most referentials"
    reason: "Projects table not yet created; will be updated in Phase 2"
  - id: dec-01-04-3
    choice: "Departments usage count tracks teams immediately"
    reason: "Teams table exists and has department foreign key"

metrics:
  duration: "16 minutes"
  completed: "2026-02-03"
---

# Phase 01 Plan 04: Admin Referentials API Summary

**One-liner:** Complete CRUD REST API for all 9 referential types with admin-only access, usage tracking, and delete protection.

## What Was Built

### Admin Middleware and Infrastructure

Created `require-admin.ts` middleware that:
- Checks `request.user.role === 'admin'`
- Returns 403 Forbidden for non-admin users
- Applied to all routes under `/api/admin/*`

Created `db.ts` plugin that:
- Decorates Fastify instance with drizzle database connection
- Enables `fastify.db` access in all route handlers
- Extended FastifyInstance type declaration

### Referentials Route Aggregator

Created `/api/admin` root that:
- Lists all 9 referential types with their endpoints
- Applies admin check to all child routes
- Registers all individual referential route modules

### 9 Referential CRUD Endpoints

Each endpoint provides:
- `GET /` - List all items with `usageCount`
- `GET /:id` - Get single item with usage details
- `POST /` - Create with validation (returns 201)
- `PUT /:id` - Update with validation
- `DELETE /:id` - Delete with usage protection (409 when in use)

| Endpoint | Special Validations |
|----------|---------------------|
| departments | Teams usage count, delete blocked if teams exist |
| teams | Department existence check, joins department name |
| statuses | Hex color validation, display order |
| outcomes | Score examples (1-5) |
| cost-centers | Unique code validation |
| currency-rates | 3-letter currency codes, positive rate, date range |
| committee-thresholds | Level enum, min/max amount validation |
| cost-tshirt-thresholds | Size enum (XS-XXL) |
| competence-month-patterns | Company enum (THIF/EIL) |

## Commits

| Hash | Description |
|------|-------------|
| 1f78721 | Create admin middleware and route structure |
| 0533641 | Add CRUD routes for departments, teams, and statuses |
| b7272f4 | Add CRUD routes for remaining 6 referentials |

## API Examples

```bash
# List all referential types
GET /api/admin

# CRUD for departments
GET /api/admin/departments
GET /api/admin/departments/1
POST /api/admin/departments {"name": "IT"}
PUT /api/admin/departments/1 {"name": "Information Technology"}
DELETE /api/admin/departments/1

# Delete protection example
DELETE /api/admin/departments/1
# Returns 409: {"error":"Cannot delete","message":"Department is used by 3 team(s)","usageCount":3}
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created db plugin**
- **Found during:** Task 1
- **Issue:** Plan referenced `fastify.db` but no db plugin existed
- **Fix:** Created `backend/src/plugins/db.ts` and extended FastifyInstance type
- **Files created:** `backend/src/plugins/db.ts`, modified `backend/src/types/fastify.d.ts`
- **Commit:** 1f78721

## Verification Results

- TypeScript compiles without errors
- All 9 referential types have complete CRUD endpoints
- Each list endpoint returns items with `usageCount` field
- Delete returns 409 when item is in use (departments -> teams verified)
- Create returns 201 with created item
- Update returns updated item
- Invalid requests return appropriate 400 errors with descriptive messages

## Next Phase Readiness

Ready for Phase 2:
- All referential CRUD endpoints operational
- Admin middleware working
- Database plugin attached to Fastify instance
- Usage count placeholders in place (will be updated when projects table exists)
