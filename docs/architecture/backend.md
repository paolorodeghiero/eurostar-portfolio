# Backend Architecture

Fastify REST API providing portfolio operations, referential management, and data import.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| Fastify 5.2 | HTTP server framework |
| TypeScript | Type safety |
| Drizzle ORM 0.38 | Database queries and migrations |
| PostgreSQL (pg 8.13) | Database driver |
| Zod 4.3 | Schema validation |
| fastify-swagger | OpenAPI documentation |
| JWKS-RSA | JWT validation for Entra ID |

## Directory Structure

```
backend/src/
├── app.ts              # Fastify app factory with plugins
├── server.ts           # Server startup
├── config/index.ts     # Configuration loader
├── db/
│   ├── schema.ts       # Drizzle table definitions
│   ├── init.ts         # Database initialization
│   ├── seed.ts         # Seed data
│   ├── demo-data.ts    # Demo dataset generator
│   └── reporting-views.ts  # Power BI snowflake views
├── plugins/
│   ├── db.ts           # Drizzle ORM plugin
│   ├── auth.ts         # JWT/Entra ID authentication
│   ├── swagger.ts      # OpenAPI documentation
│   └── dev-mode.ts     # Dev mode auth bypass
├── middleware/
│   └── require-admin.ts  # Admin authorization guard
├── routes/
│   ├── projects/       # Project CRUD and related endpoints
│   ├── admin/          # Referential management
│   ├── actuals/        # Receipts and invoices
│   └── alerts/         # Budget and deadline alerts
└── lib/
    ├── committee.ts    # Committee threshold logic
    ├── cost-tshirt.ts  # T-shirt sizing for costs
    ├── currency-converter.ts  # Multi-currency conversion
    └── project-id-generator.ts  # PRJ-YYYY-INC format
```

## Plugin Architecture

Fastify plugins encapsulate functionality:

```
app.ts
├── @fastify/cors (CORS configuration)
├── @fastify/multipart (file uploads)
├── plugins/db.ts (Drizzle ORM instance)
├── plugins/auth.ts (JWT validation)
├── plugins/swagger.ts (API docs at /api/docs)
└── plugins/dev-mode.ts (mock auth in development)
```

## Request Lifecycle

```
Request → CORS → Auth (JWT validate) → Route Handler → Response
                    ↓
              Zod Schema Validation
                    ↓
              Business Logic (lib/)
                    ↓
              Drizzle Query (db/)
                    ↓
              PostgreSQL
```

## Route Registration

Routes are organized by domain and registered in `app.ts`:

```typescript
// Projects domain
app.register(projectRoutes, { prefix: '/api/projects' })
app.register(projectBudgetRoutes, { prefix: '/api/projects' })
app.register(projectValuesRoutes, { prefix: '/api/projects' })
// ...

// Admin domain
app.register(departmentsRoutes, { prefix: '/api/admin/departments' })
app.register(teamsRoutes, { prefix: '/api/admin/teams' })
// ...

// Financial domain
app.register(actualsRoutes, { prefix: '/api/actuals' })
```

## Authentication

Two modes:
1. **Production**: JWT validation against Entra ID JWKS endpoint
2. **Development** (`DEV_MODE=true`): Bypass auth, inject mock user

Admin routes require `ADMIN_GROUP_ID` membership in JWT claims.

## Database Interaction

Drizzle ORM provides:
- Type-safe queries via generated types from `schema.ts`
- Migration management via `drizzle-kit`
- Connection pooling via `pg` driver

Pattern:
```typescript
const result = await db.select()
  .from(projects)
  .where(eq(projects.id, id))
  .leftJoin(teams, eq(projects.leadTeamId, teams.id))
```

## Error Handling

- Zod validation errors → 400 with field-level messages
- Not found → 404 with entity type
- Authorization failures → 401/403
- Database constraints → 409 for conflicts
