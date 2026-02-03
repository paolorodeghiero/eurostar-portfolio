---
phase: 01-foundation-authentication
plan: 01
subsystem: core-infrastructure
tags: [fastify, react, drizzle, postgresql, typescript]

dependency-graph:
  requires: []
  provides:
    - backend-server
    - database-schema
    - frontend-app
  affects:
    - 01-02 (auth)
    - 01-03 (referential-api)

tech-stack:
  added:
    - fastify@5.2.1
    - "@fastify/cors@10.0.2"
    - drizzle-orm@0.38.4
    - pg@8.13.1
    - react@19.0.0
    - react-dom@19.0.0
    - vite@6.1.0
  patterns:
    - ESM modules with TypeScript
    - Connection pooling with pg Pool
    - Identity columns for PostgreSQL tables
    - Vite proxy for API requests

file-tracking:
  created:
    - backend/package.json
    - backend/tsconfig.json
    - backend/src/server.ts
    - backend/drizzle.config.ts
    - backend/src/db/schema.ts
    - backend/src/db/index.ts
    - frontend/package.json
    - frontend/tsconfig.json
    - frontend/vite.config.ts
    - frontend/index.html
    - frontend/src/main.tsx
    - frontend/src/App.tsx
    - frontend/src/vite-env.d.ts
    - .env.example
    - docker-compose.yml
  modified: []

decisions:
  - id: use-identity-columns
    choice: PostgreSQL identity columns instead of serial
    rationale: Modern PostgreSQL best practice per research

metrics:
  duration: 14m
  completed: 2026-02-03
---

# Phase 01 Plan 01: Project Scaffolding Summary

**One-liner:** Full-stack TypeScript scaffolding with Fastify 5 backend, React 19 frontend, and Drizzle ORM database schema for all 9 referential tables.

## What Was Built

### Backend (Fastify 5 + TypeScript)
- TypeScript project with ESM modules
- Fastify server with logger enabled
- CORS configured for frontend origin
- Health check endpoint (GET /health)
- Environment variable configuration

### Database (PostgreSQL 16 + Drizzle ORM)
- Docker Compose setup for PostgreSQL 16
- Complete schema with 9 referential tables:
  - `departments` - organization departments
  - `teams` - teams with FK to departments
  - `statuses` - project status options with colors
  - `outcomes` - value scoring categories with examples
  - `cost_centers` - financial cost centers
  - `currency_rates` - EUR/GBP exchange rates with validity periods
  - `committee_thresholds` - budget thresholds for governance
  - `cost_tshirt_thresholds` - T-shirt size budget mapping
  - `competence_month_patterns` - regex patterns by company
- Connection pooling (max 20, 30s idle timeout)
- Migration system initialized

### Frontend (React 19 + Vite 6)
- TypeScript project with strict mode
- Vite dev server with API proxy to backend
- Placeholder app with Eurostar branding (teal #006B6B header)
- React 19 with StrictMode enabled

## Commits

| Commit | Description |
|--------|-------------|
| `4954a0b` | Backend scaffolding with Fastify 5, health endpoint |
| `d2d579f` | Database schema with all 9 referential tables |
| `9113d3b` | Frontend scaffolding with React 19 + Vite |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

| Check | Status | Evidence |
|-------|--------|----------|
| Backend starts | PASS | Server listening on port 3000 |
| Health endpoint | PASS | Returns `{"status":"ok","timestamp":"..."}` |
| Database tables | PASS | 9 tables created in eurostar_portfolio |
| Frontend loads | PASS | Renders "Eurostar Portfolio" heading |
| TypeScript compiles | PASS | No errors in backend or frontend |

## Key Artifacts

### Backend Entry Point
**File:** `backend/src/server.ts`
```typescript
// Fastify server with health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});
```

### Database Schema (partial)
**File:** `backend/src/db/schema.ts`
```typescript
export const departments = pgTable('departments', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Environment Configuration
**File:** `.env.example`
- PORT, DATABASE_URL, FRONTEND_URL
- DEV_MODE for auth bypass
- ENTRA_TENANT_ID, ENTRA_CLIENT_ID, ADMIN_GROUP_ID

## Next Phase Readiness

### Required for 01-02 (Authentication)
- [x] Backend server running
- [x] Health endpoint working
- [x] Environment variables defined
- [ ] ENTRA credentials configured (user action)

### Required for 01-03 (Referential API)
- [x] Database schema complete
- [x] Drizzle ORM configured
- [x] Connection pool ready

## Notes

- Used existing PostgreSQL container on port 5432 (eurostar-portfolio-postgres-1)
- Database was recreated fresh to apply new schema
- All packages installed with current stable versions as of Feb 2026
