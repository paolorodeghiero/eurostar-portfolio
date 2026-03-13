# Backend Overview

The backend is a Fastify REST API with Drizzle ORM for database access.

## Technology Stack

| Package | Version |
|---------|---------|
| Fastify | 5.2.1 |
| Drizzle ORM | 0.38.4 |
| PostgreSQL (pg) | 8.13.1 |
| Zod (validation) | 4.3.6 |
| TypeScript | 5.7.3 |

Supporting packages:
- `@fastify/cors` - Cross-origin resource sharing
- `@fastify/multipart` - File uploads (10MB limit)
- `@fastify/swagger` / `@fastify/swagger-ui` - OpenAPI documentation at `/docs`
- `jsonwebtoken` / `jwks-rsa` - EntraID JWT validation
- `xlsx` - Excel file parsing and generation

## Directory Structure

```
backend/src/
  app.ts           # Fastify app factory with plugin registration
  server.ts        # Entry point - runs startup init and starts server
  config/
    index.ts       # Environment configuration
  db/
    index.ts       # Database connection pool and Drizzle instance
    schema.ts      # All table definitions
    init.ts        # Startup initialization (migrations + system data)
    seed.ts        # Reference data seeding
  lib/             # Business logic modules (see services.md)
  middleware/
    require-admin.ts  # Admin role preHandler hook
  plugins/
    auth.ts        # JWT validation and user context
    db.ts          # Database decorator and audit context
    dev-mode.ts    # Development user bypass
    swagger.ts     # OpenAPI documentation
  routes/          # Route handlers organized by domain
    admin/         # Admin referential routes (see routes.md)
    actuals/       # Receipt and invoice routes
    alerts/        # Alert routes
    projects/      # Project CRUD and sub-resources
  types/
    fastify.d.ts   # Fastify instance and request type extensions
```

## Server Configuration

### Entry Point (`server.ts`)

Runs database initialization before starting the server:

```typescript
await runStartupInit();
const fastify = await build({ logger: true });
await fastify.listen({ port: config.port, host: '0.0.0.0' });
```

### App Factory (`app.ts`)

Registers plugins in order:
1. CORS with frontend URL from config
2. Multipart for file uploads
3. Static file serving (uploads directory)
4. Database plugin (decorates `fastify.db`)
5. Auth plugin (validates JWT, populates `request.user`)
6. Swagger plugin (OpenAPI docs at `/docs`)

Routes are mounted with prefixes:
- `/api/admin` - Referential data management
- `/api/projects` - Project resources
- `/api/actuals` - Receipts and invoices
- `/api/alerts` - Alert queries and config

### Configuration (`config/index.ts`)

Environment variables:
- `DATABASE_URL` - PostgreSQL connection string (required)
- `ENTRA_TENANT_ID` - Azure tenant ID (required in production)
- `ENTRA_CLIENT_ID` - Azure client ID (required in production)
- `ADMIN_GROUP_ID` - Azure group ID for admin role
- `FRONTEND_URL` - CORS origin (default: `http://localhost:5173`)
- `PORT` - Server port (default: 3000)
- `DEV_MODE=true` - Skip authentication, use dev user

## Database

### Connection Pool

Uses `pg` with connection pooling:
- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

### Schema

Drizzle schema in `db/schema.ts` defines all tables with TypeScript types. Tables use:
- Auto-generated integer IDs
- Timestamp columns (`createdAt`, `updatedAt`)
- Foreign key constraints with appropriate `onDelete` behavior

### Audit Context

The db plugin sets a PostgreSQL session variable `app.current_user_email` on each request. Database triggers use this for audit logging.

## Authentication

The auth plugin runs as a `preValidation` hook on all routes except `/health` and `/docs/*`.

In production:
- Extracts Bearer token from Authorization header
- Validates JWT signature against EntraID JWKS
- Checks audience and issuer claims
- Determines admin role from group membership

In dev mode (`DEV_MODE=true`):
- Bypasses JWT validation
- Uses mock user with admin role

User object on `request.user`:
```typescript
{
  id: string;      // EntraID oid
  email: string;
  name?: string;
  role: 'admin' | 'user';
}
```
