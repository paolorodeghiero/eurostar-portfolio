# Architecture Overview

The Eurostar Portfolio application is a three-tier web application for IT project portfolio management.

## System Components

### Frontend
- **Framework:** React 19 with TypeScript
- **Build tool:** Vite
- **UI components:** Radix UI primitives with Tailwind CSS
- **Routing:** React Router
- **Authentication:** Azure MSAL (Microsoft Entra ID) with dev mode bypass
- **Location:** `frontend/`

### Backend
- **Framework:** Fastify 5 with TypeScript
- **ORM:** Drizzle ORM
- **API style:** REST with Zod validation
- **Authentication:** JWT validation via JWKS
- **Documentation:** OpenAPI/Swagger
- **Location:** `backend/`

### Database
- **Engine:** PostgreSQL
- **Schema management:** Drizzle Kit migrations
- **Connection pooling:** pg Pool (max 20 connections)
- **Location:** `backend/src/db/`

For table definitions and relationships, see [database.md](./database.md).

## Component Connections

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                          │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   React UI   │───>│  React Router│───>│  MSAL Auth       │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│         │                                        │              │
│         │ HTTP requests                          │ Token        │
│         └────────────────────────────────────────┼──────────────┤
│                                                  │              │
└──────────────────────────────────────────────────│──────────────┘
                                                   │
                        CORS + Bearer Token        │
                                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Backend API                            │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   Fastify    │───>│  Auth Plugin │───>│  Route Handlers  │  │
│  │   Server     │    │  (JWT/JWKS)  │    │                  │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│                                                  │              │
│                             ┌────────────────────┘              │
│                             ▼                                   │
│                    ┌──────────────────┐                         │
│                    │  Drizzle ORM     │                         │
│                    └──────────────────┘                         │
│                             │                                   │
└─────────────────────────────│───────────────────────────────────┘
                              │
                    PostgreSQL connection
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PostgreSQL                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Tables: projects, teams, departments, statuses, etc.    │  │
│  │  Audit triggers for change tracking                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Patterns

### Authentication Flow
1. User accesses frontend
2. MSAL redirects to Microsoft Entra ID for login
3. User authenticates and receives ID token + access token
4. Frontend includes access token in Authorization header
5. Backend validates token via JWKS endpoint
6. User context (email, groups) extracted from token claims

### API Request Flow
1. React component calls API via fetch
2. Request includes Bearer token in Authorization header
3. Fastify auth plugin validates token
4. Route handler processes request with Drizzle ORM
5. Database query executed via connection pool
6. Response returned as JSON

### Audit Trail Flow
1. Backend sets PostgreSQL session variable `app.current_user_email`
2. Database triggers capture INSERT/UPDATE/DELETE operations
3. Changes recorded in `audit_log` table with user attribution
4. Audit log queryable via admin API

## API Route Structure

| Prefix | Purpose |
|--------|---------|
| `/health` | Health check (no auth) |
| `/api/me` | Current user info |
| `/api/admin/*` | Reference data management |
| `/api/projects/*` | Project CRUD operations |
| `/api/actuals/*` | Receipts and invoices |
| `/api/alerts/*` | Alert configuration |

## Development Modes

### Production Mode
- Full MSAL authentication required
- JWT tokens validated against Microsoft Entra ID
- Environment variables required: `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, `ADMIN_GROUP_ID`

### Development Mode
- Enabled via `DEV_MODE=true` environment variable
- Bypasses MSAL authentication
- Uses mock `dev-user` for audit trail
- Requires only `DATABASE_URL`
