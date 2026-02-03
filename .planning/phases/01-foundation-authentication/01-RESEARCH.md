# Phase 1: Foundation & Authentication - Research

**Researched:** 2026-02-03
**Domain:** Enterprise authentication (EntraID/MSAL), full-stack TypeScript, referential data management
**Confidence:** HIGH

## Summary

Phase 1 establishes the authentication foundation using Microsoft EntraID with MSAL libraries for both frontend and backend, PostgreSQL with Drizzle ORM for database management, and a Fastify 5 + React 19 architecture. The research reveals a mature ecosystem with well-documented patterns, though some compatibility challenges exist with React 19 and MSAL (as of early 2026).

Key findings:
- MSAL-node is for token **acquisition**, not validation - backend APIs need separate JWT validation libraries (jwks-rsa + jsonwebtoken)
- Fastify authentication should use early hooks (preParsing/preValidation) to avoid processing unauthorized request bodies
- Drizzle ORM has migrated to identity columns over serial, and emphasizes connection pooling for production
- React 19 is now stable but MSAL React may require workarounds for peer dependency compatibility
- shadcn/ui provides production-ready patterns for admin CRUD interfaces with TanStack Table

**Primary recommendation:** Use jwks-rsa + jsonwebtoken for backend token validation, implement authentication in Fastify's preValidation hook, leverage Drizzle's identity columns with proper connection pooling, and prepare for potential MSAL React peer dependency warnings with React 19.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @azure/msal-node | 3.8.6 | Frontend token acquisition | Official Microsoft library, actively maintained by Microsoft for EntraID |
| @azure/msal-react | Latest | React integration for MSAL | Official React wrapper, provides hooks and context |
| @azure/msal-browser | Latest | Browser-side MSAL functionality | Core browser library used by msal-react |
| jwks-rsa | Latest | Fetch Azure AD public keys | Standard for JWT signature verification with rotating keys |
| jsonwebtoken | Latest | JWT verification | De facto standard for JWT operations in Node.js |
| fastify | 5.x | Backend framework | High performance, TypeScript-first, extensive plugin ecosystem |
| @fastify/auth | Latest | Auth composition | Official Fastify auth plugin for composing multiple strategies |
| drizzle-orm | Latest | TypeScript ORM | Type-safe, minimal overhead, SQL-like syntax |
| drizzle-kit | Latest | Migration tooling | Schema generation and migration management |
| pg | Latest | PostgreSQL client | Node-postgres, standard driver for Drizzle with connection pooling |
| react | 19.x | UI framework | Latest stable, concurrent rendering by default |
| vite | 6.x | Build tool | Fast HMR, modern defaults, excellent TypeScript support |
| shadcn/ui | Latest | Component library | Radix UI + Tailwind, copy-paste components, customizable |
| @tanstack/react-table | Latest | Table library | Headless, flexible, perfect for admin CRUD interfaces |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/pg | Latest | TypeScript types for pg | Required for TypeScript projects |
| dotenv | Latest | Environment variable loading | Development environment configuration |
| tailwindcss | 4.x | Utility-first CSS | Required for shadcn/ui components |
| @tailwindcss/vite | Latest | Vite plugin for Tailwind v4 | Required for Vite + Tailwind v4 |
| typescript | 5.x | Type safety | Entire stack is TypeScript |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Fastify | Express | Express has larger ecosystem but slower performance and less TypeScript-native |
| Drizzle ORM | Prisma | Prisma has better tooling UI but generates client code and has more overhead |
| jwks-rsa + jsonwebtoken | passport-azure-ad | passport-azure-ad is **deprecated and archived** - must use manual JWT validation |
| shadcn/ui | Material UI / Ant Design | Component libraries are heavier, less customizable, and don't match Linear/Notion aesthetic |
| TanStack Table | react-table v7 | v7 is deprecated, TanStack Table (v8) is the current version |

**Installation:**
```bash
# Backend
npm install fastify @fastify/auth jwks-rsa jsonwebtoken drizzle-orm pg dotenv
npm install -D drizzle-kit @types/pg @types/jsonwebtoken @types/node tsx typescript

# Frontend
npm install react react-dom @azure/msal-react @azure/msal-browser @tanstack/react-table
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom

# shadcn/ui (install via CLI after Vite setup)
npx shadcn@latest init
```

## Architecture Patterns

### Recommended Project Structure
```
eurostar-portfolio-gsd/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts           # Drizzle schema definitions
│   │   │   ├── index.ts            # Database connection with pool
│   │   │   └── migrations/         # Generated migration files
│   │   ├── plugins/
│   │   │   ├── auth.ts             # Authentication plugin with JWT validation
│   │   │   ├── db.ts               # Database plugin (decorates with db instance)
│   │   │   └── dev-mode.ts         # Development mode auth bypass
│   │   ├── routes/
│   │   │   ├── admin/
│   │   │   │   └── referentials.ts # Admin CRUD routes
│   │   │   └── health.ts           # Health check route
│   │   ├── hooks/
│   │   │   └── auth-hooks.ts       # preValidation hook for token validation
│   │   └── server.ts               # Fastify server setup
│   ├── drizzle.config.ts           # Drizzle Kit configuration
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui components
│   │   │   └── admin/
│   │   │       ├── data-table.tsx  # Reusable DataTable component
│   │   │       └── columns/        # Column definitions per referential
│   │   ├── lib/
│   │   │   ├── auth-config.ts      # MSAL configuration
│   │   │   └── api-client.ts       # API client with token injection
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   └── referentials/   # Admin pages per referential type
│   │   │   └── Login.tsx
│   │   ├── App.tsx                 # MsalProvider wrapper
│   │   └── main.tsx
│   ├── vite.config.ts
│   ├── tailwind.config.ts          # Tailwind v4 config
│   ├── tsconfig.json
│   └── package.json
└── .env                            # Environment variables
```

### Pattern 1: EntraID Authentication Flow

**What:** Frontend acquires token via MSAL React, backend validates token via JWT libraries

**When to use:** All authenticated API requests

**Frontend - Token Acquisition:**
```typescript
// Source: https://learn.microsoft.com/en-us/entra/msal/javascript/react/getting-started
import { MsalProvider, useMsal } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
  auth: {
    clientId: process.env.VITE_ENTRA_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.VITE_ENTRA_TENANT_ID}`,
  },
  cache: {
    cacheLocation: "localStorage", // Enable session persistence
    storeAuthStateInCookie: false,
  }
};

const msalInstance = new PublicClientApplication(msalConfig);

// In App.tsx
function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <YourApp />
    </MsalProvider>
  );
}

// In API client
function ApiClient() {
  const { instance, accounts } = useMsal();

  const getToken = async () => {
    const request = {
      scopes: ["api://your-api-id/.default"],
      account: accounts[0]
    };

    const response = await instance.acquireTokenSilent(request);
    return response.accessToken;
  };

  // Use token in API requests
}
```

**Backend - Token Validation:**
```typescript
// Source: https://medium.com/@ketanpradhan/verifying-microsoft-azure-ad-jwt-tokens-in-node-js-d38f54cbb791
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/discovery/v2.0/keys`
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.getPublicKey();
    callback(err, signingKey);
  });
}

export async function validateToken(token: string): Promise<jwt.JwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      audience: process.env.ENTRA_CLIENT_ID,
      issuer: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/v2.0`,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded as jwt.JwtPayload);
    });
  });
}
```

### Pattern 2: Fastify Authentication Hook

**What:** Use preValidation hook to validate tokens before processing request

**When to use:** Global authentication or route-specific authentication

**Example:**
```typescript
// Source: https://fastify.dev/docs/latest/Reference/Hooks/
import { FastifyRequest, FastifyReply } from 'fastify';
import { validateToken } from './jwt-validator';

// Global hook (in plugin)
fastify.addHook('preValidation', async (request: FastifyRequest, reply: FastifyReply) => {
  // Skip auth in dev mode
  if (process.env.DEV_MODE === 'true') {
    request.user = { id: 'dev-user', role: 'admin' };
    return;
  }

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = await validateToken(token);

    // Check roles/groups from token claims
    const groups = decoded.groups || [];
    const isAdmin = groups.includes(process.env.ADMIN_GROUP_ID);

    request.user = {
      id: decoded.oid,
      email: decoded.email,
      role: isAdmin ? 'admin' : 'user'
    };
  } catch (err) {
    return reply.code(401).send({ error: 'Invalid token' });
  }
});

// Route-specific (admin-only)
fastify.get('/admin/referentials', {
  preValidation: async (request, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden' });
    }
  }
}, async (request, reply) => {
  // Handler logic
});
```

### Pattern 3: Drizzle Schema with Identity Columns

**What:** Use PostgreSQL identity columns instead of serial, with proper foreign keys

**When to use:** All table definitions

**Example:**
```typescript
// Source: https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717
import { pgTable, integer, varchar, timestamp } from 'drizzle-orm/pg-core';

// Modern identity column pattern (2026 best practice)
export const departments = pgTable('departments', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity({
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 2147483647,
    cache: 1
  }),
  name: varchar('name', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const teams = pgTable('teams', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 500 }),
  departmentId: integer('department_id')
    .notNull()
    .references(() => departments.id, { onDelete: 'restrict' }), // Prevent delete if in use
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
```

### Pattern 4: Connection Pooling with Drizzle

**What:** Use node-postgres Pool with proper configuration for production

**When to use:** Database connection setup

**Example:**
```typescript
// Source: https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Fail fast if connection takes > 2s
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

// Lifecycle management in Fastify
fastify.decorate('db', drizzle(pool, { schema }));

fastify.addHook('onClose', async () => {
  await pool.end();
});
```

### Pattern 5: Usage Count and Delete Protection

**What:** Check foreign key references before allowing deletion

**When to use:** All referential delete operations

**Example:**
```typescript
// Source: https://www.datacamp.com/tutorial/sql-on-delete-restrict
import { eq, count } from 'drizzle-orm';
import { departments, teams } from './schema';

async function deleteDepartment(db: Database, departmentId: number) {
  // Check usage count
  const [result] = await db
    .select({ count: count() })
    .from(teams)
    .where(eq(teams.departmentId, departmentId));

  const usageCount = result.count;

  if (usageCount > 0) {
    throw new Error(`Cannot delete department: used by ${usageCount} team(s)`);
  }

  // Safe to delete
  await db.delete(departments).where(eq(departments.id, departmentId));
}

// Get usage details
async function getDepartmentUsage(db: Database, departmentId: number) {
  const usedBy = await db
    .select({
      id: teams.id,
      name: teams.name
    })
    .from(teams)
    .where(eq(teams.departmentId, departmentId));

  return {
    count: usedBy.length,
    items: usedBy
  };
}
```

### Pattern 6: shadcn/ui Data Table for CRUD

**What:** Use TanStack Table with shadcn/ui components for admin interfaces

**When to use:** All referential management screens

**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/data-table
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';

// Column definition
export const departmentColumns: ColumnDef<Department>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    id: 'usage',
    header: 'Usage',
    cell: ({ row }) => {
      const count = row.original.usageCount || 0;
      return <span>{count} team(s)</span>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const department = row.original;
      return (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => editDepartment(department)}>
            Edit
          </Button>
          <Button
            variant="destructive"
            disabled={department.usageCount > 0}
            onClick={() => deleteDepartment(department.id)}
          >
            Delete
          </Button>
        </div>
      );
    },
  },
];

// Usage
function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    fetchDepartments().then(setDepartments);
  }, []);

  return <DataTable columns={departmentColumns} data={departments} />;
}
```

### Pattern 7: Development Mode Authentication Bypass

**What:** Conditional authentication based on environment variable

**When to use:** Local development without EntraID setup

**Example:**
```typescript
// Source: https://oneuptime.com/blog/post/2026-01-06-nodejs-production-environment-variables/view
import { FastifyRequest, FastifyReply } from 'fastify';

export async function authHook(request: FastifyRequest, reply: FastifyReply) {
  // Development mode bypass
  if (process.env.DEV_MODE === 'true') {
    request.user = {
      id: 'dev-user',
      email: 'dev@example.com',
      role: 'admin', // Full access in dev mode
      name: 'Development User'
    };
    return; // Skip token validation
  }

  // Production: full token validation
  // ... JWT validation logic ...
}

// Validation with defaults
const DEV_MODE = process.env.DEV_MODE === 'true';
const ADMIN_GROUP_ID = process.env.ADMIN_GROUP_ID || '';

if (!ADMIN_GROUP_ID && !DEV_MODE) {
  throw new Error('ADMIN_GROUP_ID environment variable is required in production');
}
```

### Anti-Patterns to Avoid

- **Using @msal-node for backend token validation:** MSAL Node is for token acquisition, not validation. Always use jwks-rsa + jsonwebtoken for backend validation.
- **Using passport-azure-ad:** This library is deprecated and archived. Do not use it for new projects.
- **Using preHandler hook for authentication:** This processes the request body before auth, wasting memory on unauthorized requests. Use preValidation or preParsing instead.
- **Manually modifying migration files:** Let Drizzle Kit generate migrations. Hand-editing can break migration history.
- **Mixing `drizzle-kit push` and `drizzle-kit generate`:** Use `push` only for local development, `generate` + `migrate` for production.
- **Hard-coding environment-specific logic:** Use environment variables, not if/else blocks checking `NODE_ENV === 'development'` everywhere.
- **Calling MSAL login/logout outside MsalProvider context:** Components won't update properly. Always ensure MsalProvider wraps your app.
- **Using serial instead of identity columns:** PostgreSQL recommends identity columns as of recent versions.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT validation with Azure AD | Custom JWT verification | jwks-rsa + jsonwebtoken | Handles key rotation, caching, proper RS256 verification |
| React authentication state | Custom auth context | @azure/msal-react hooks | Handles token refresh, silent SSO, interaction state |
| Token caching | Custom cache logic | MSAL built-in cache | Handles localStorage/sessionStorage, secure token storage |
| Admin data tables | Custom table component | shadcn/ui + TanStack Table | Sorting, filtering, pagination, column visibility built-in |
| Database migrations | Custom SQL scripts | drizzle-kit | Schema diffing, migration generation, rollback support |
| Connection pooling | Manual connection management | node-postgres Pool | Connection reuse, timeout handling, lifecycle management |
| Role-based access | Custom middleware | EntraID groups claims | Centralized in Azure, no application-side role storage |
| Form validation | Custom validators | react-hook-form + zod | Type-safe, declarative, minimal re-renders |

**Key insight:** Microsoft's identity platform and modern TypeScript ecosystem have solved these problems comprehensively. Custom solutions introduce security risks (JWT validation), maintenance burden (migrations), or poor UX (auth state management).

## Common Pitfalls

### Pitfall 1: MSAL React Session Loss on Refresh

**What goes wrong:** Users must re-login after browser refresh despite valid tokens

**Why it happens:**
- Incorrect cache configuration (using sessionStorage instead of localStorage)
- Version incompatibility between @azure/msal-browser and @azure/msal-react
- Not calling acquireTokenSilent on app initialization

**How to avoid:**
- Set `cacheLocation: "localStorage"` in MSAL config for cross-tab persistence
- Use latest versions together (reported issues with msal-browser 3.2.0+ and msal-react 2.0.4+)
- Initialize authentication state on app mount:
```typescript
useEffect(() => {
  const accounts = instance.getAllAccounts();
  if (accounts.length > 0) {
    instance.setActiveAccount(accounts[0]);
  }
}, [instance]);
```

**Warning signs:**
- Users report "logging out" when refreshing
- Tokens exist in localStorage but app shows unauthenticated state
- GitHub issues mention downgrading to msal-browser 3.2.0

**References:**
- [MSAL React Session Persistence Issue](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/6608)
- [MSAL React Getting Started](https://learn.microsoft.com/en-us/entra/msal/javascript/react/getting-started)

### Pitfall 2: React 19 Peer Dependency Warnings with MSAL

**What goes wrong:** npm install fails or warns about React 19 incompatibility

**Why it happens:**
- As of early 2026, @azure/msal-react has not updated peer dependencies to include React 19
- React 19 made breaking changes that may affect MSAL internals

**How to avoid:**
- Check GitHub issue status: [#7455](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/7455) and [#7577](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/7577)
- Use `--legacy-peer-deps` flag if peer dependency check fails: `npm install --legacy-peer-deps`
- Monitor for official React 19 support announcement
- Consider testing thoroughly with React 19 despite warnings

**Warning signs:**
- npm/pnpm errors about peer dependency resolution
- GitHub issues reporting "Support for React 19 is critically required"

**References:**
- [React 19 Peer Dependency Issue](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/7577)

### Pitfall 3: Memory Waste with Wrong Fastify Hook

**What goes wrong:** Backend parses large request bodies from unauthorized requests, wasting memory and CPU

**Why it happens:**
- Using preHandler hook for authentication means body is already parsed
- Malicious users can send large payloads that consume resources even if they'll be rejected

**How to avoid:**
- Use preValidation or preParsing hooks for authentication:
```typescript
// GOOD: Auth before body parsing
fastify.addHook('preValidation', authHook);

// BAD: Auth after body parsing
fastify.addHook('preHandler', authHook);
```
- Only use preHandler if authentication logic needs the parsed body (rare)

**Warning signs:**
- High memory usage during auth failures
- Slow response times for 401 errors
- Large request logs for unauthorized attempts

**References:**
- [Fastify Hooks Documentation](https://fastify.dev/docs/latest/Reference/Hooks/)
- [Custom Authentication Strategy](https://dev.to/lek890/custom-authentication-strategy-in-fastify-using-decorators-lifecycle-hooks-and-fastify-auth-2fo7)

### Pitfall 4: Drizzle Migration History Loss

**What goes wrong:** Cannot run migrations in production after accidentally deleting migration folder

**Why it happens:**
- Developer deletes `drizzle/` folder thinking it's regenerable
- Migration history is lost, but production database already has tables
- Drizzle can't reconcile state: "table already exists" errors

**How to avoid:**
- **Always commit migration files to git**
- Never manually delete migration folders
- Use `drizzle-kit generate` to create new migrations, never edit old ones
- For local development, use `drizzle-kit push` (skips migrations entirely)
- Production workflow: generate → commit → deploy → migrate

**Warning signs:**
- "relation already exists" errors during migration
- Missing `meta/` folder in `drizzle/` directory
- Mismatch between schema.ts and database state

**References:**
- [3 Biggest Mistakes with Drizzle ORM](https://medium.com/@lior_amsalem/3-biggest-mistakes-with-drizzle-orm-1327e2531aff)
- [Drizzle Migrations Discussion](https://github.com/drizzle-team/drizzle-orm/discussions/4408)

### Pitfall 5: MSAL Interaction Already In Progress

**What goes wrong:** Application throws "interaction_in_progress" error when user tries to login

**Why it happens:**
- Calling loginPopup/loginRedirect while another login is in progress
- Router navigation interrupting token acquisition
- Multiple components triggering authentication simultaneously

**How to avoid:**
- Check `inProgress` state before initiating login:
```typescript
const { instance, inProgress } = useMsal();

const handleLogin = () => {
  if (inProgress === "none") {
    instance.loginPopup();
  }
};
```
- Ensure router doesn't strip hash during redirect flow
- Use single login button, not multiple scattered across app

**Warning signs:**
- Error message: "interaction_in_progress"
- Users can't complete login flow
- Multiple login prompts appearing

**References:**
- [MSAL Common Errors](https://learn.microsoft.com/en-us/entra/msal/javascript/browser/errors)
- [MSAL React FAQ](https://learn.microsoft.com/en-us/entra/msal/javascript/react/faq)

### Pitfall 6: Foreign Key Deletion Without Check

**What goes wrong:** Application crashes or shows database errors when admin tries to delete used referential items

**Why it happens:**
- No usage count check before delete attempt
- PostgreSQL `ON DELETE RESTRICT` constraint blocks deletion
- Poor error handling exposes database errors to user

**How to avoid:**
- Always query usage count before showing delete button:
```typescript
const usageCount = await db
  .select({ count: count() })
  .from(projects)
  .where(eq(projects.departmentId, deptId));

if (usageCount[0].count > 0) {
  // Disable delete, show warning
}
```
- Use `ON DELETE RESTRICT` on foreign keys (explicit protection)
- Show helpful error: "Cannot delete: used by 5 projects"

**Warning signs:**
- Database errors bubbling to frontend
- "violates foreign key constraint" messages
- Users confused why delete fails

**References:**
- [SQL ON DELETE RESTRICT](https://www.datacamp.com/tutorial/sql-on-delete-restrict)

### Pitfall 7: Environment Variable Anti-Patterns

**What goes wrong:** Hard-coded conditionals throughout codebase, missing variables in production

**Why it happens:**
- Checking `process.env.NODE_ENV === 'development'` in many places
- No validation that required variables exist
- Mixing configuration logic with business logic

**How to avoid:**
- Validate environment variables at startup:
```typescript
const requiredEnvVars = ['DATABASE_URL', 'ENTRA_CLIENT_ID', 'ADMIN_GROUP_ID'];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}
```
- Use single source of truth for configuration:
```typescript
// config.ts
export const config = {
  isDev: process.env.DEV_MODE === 'true',
  database: {
    url: process.env.DATABASE_URL!
  },
  auth: {
    devMode: process.env.DEV_MODE === 'true',
    adminGroupId: process.env.ADMIN_GROUP_ID!
  }
};
```
- Check configuration once at app level, not scattered throughout

**Warning signs:**
- Many `if (process.env.NODE_ENV === ...)` blocks
- Different behavior in dev/prod not documented
- Production crashes from missing variables

**References:**
- [Node.js Environment Variables Best Practices](https://oneuptime.com/blog/post/2026-01-06-nodejs-production-environment-variables/view)
- [Environment Variables Anti-Patterns](https://lirantal.com/blog/environment-variables-configuration-anti-patterns-node-js-applications)

## Code Examples

Verified patterns from official sources:

### Complete MSAL React Setup

```typescript
// Source: https://learn.microsoft.com/en-us/entra/msal/javascript/react/getting-started
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import { PublicClientApplication, InteractionType } from "@azure/msal-browser";

// Configuration
const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_ENTRA_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage", // Session persistence
    storeAuthStateInCookie: false,
  }
};

const msalInstance = new PublicClientApplication(msalConfig);

// App wrapper
function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthenticatedTemplate>
        <Dashboard />
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <LoginButton />
      </UnauthenticatedTemplate>
    </MsalProvider>
  );
}

// Protected API call
function Dashboard() {
  const { instance, accounts } = useMsal();

  const callApi = async () => {
    const request = {
      scopes: [`api://${import.meta.env.VITE_API_CLIENT_ID}/.default`],
      account: accounts[0]
    };

    try {
      const response = await instance.acquireTokenSilent(request);

      const apiResponse = await fetch('/api/admin/referentials', {
        headers: {
          'Authorization': `Bearer ${response.accessToken}`
        }
      });

      return apiResponse.json();
    } catch (error) {
      // Fallback to interactive if silent fails
      const response = await instance.acquireTokenPopup(request);
      // Retry API call...
    }
  };
}
```

### Complete Fastify + JWT Validation

```typescript
// Source: https://medium.com/@ketanpradhan/verifying-microsoft-azure-ad-jwt-tokens-in-node-js-d38f54cbb791
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const fastify = Fastify({ logger: true });

// JWKS client for key retrieval
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// Auth hook
fastify.addHook('preValidation', async (request, reply) => {
  // Dev mode bypass
  if (process.env.DEV_MODE === 'true') {
    request.user = { id: 'dev', email: 'dev@example.com', role: 'admin' };
    return;
  }

  // Extract token
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);

  // Validate token
  try {
    const decoded = await new Promise<jwt.JwtPayload>((resolve, reject) => {
      jwt.verify(token, getKey, {
        audience: process.env.ENTRA_CLIENT_ID,
        issuer: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/v2.0`,
        algorithms: ['RS256']
      }, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded as jwt.JwtPayload);
      });
    });

    // Extract role from groups claim
    const groups = decoded.groups || [];
    const isAdmin = groups.includes(process.env.ADMIN_GROUP_ID);

    request.user = {
      id: decoded.oid,
      email: decoded.email || decoded.preferred_username,
      role: isAdmin ? 'admin' : 'user',
      name: decoded.name
    };
  } catch (err) {
    fastify.log.error(err, 'Token validation failed');
    return reply.code(401).send({ error: 'Invalid token' });
  }
});

// Protected route
fastify.get('/admin/departments', {
  preValidation: async (request, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden' });
    }
  }
}, async (request, reply) => {
  const departments = await fastify.db.select().from(schema.departments);
  return departments;
});
```

### Complete Drizzle Setup with Connection Pool

```typescript
// Source: https://orm.drizzle.team/docs/get-started/postgresql-new
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Drizzle instance
export const db = drizzle(pool, { schema });

// Fastify plugin
import fp from 'fastify-plugin';

export default fp(async (fastify) => {
  fastify.decorate('db', db);

  fastify.addHook('onClose', async () => {
    await pool.end();
  });
});
```

### Complete shadcn/ui Data Table

```typescript
// Source: https://ui.shadcn.com/docs/components/data-table
import { useState } from 'react';
import { ColumnDef, useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    state: { sorting, columnFilters, pagination },
  });

  return (
    <div>
      <Input
        placeholder="Filter names..."
        value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
        onChange={(e) => table.getColumn('name')?.setFilterValue(e.target.value)}
        className="mb-4"
      />

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between mt-4">
        <Button
          variant="outline"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <span>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <Button
          variant="outline"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| passport-azure-ad | jwks-rsa + jsonwebtoken | 2024-2025 | passport-azure-ad archived, manual JWT validation required |
| Serial columns | Identity columns | PostgreSQL 10+ | Identity columns are PostgreSQL standard, better SQL compliance |
| drizzle-orm push only | generate + migrate | Drizzle v0.20+ | Production needs migration history, push for dev only |
| React 18 | React 19 | Dec 2024 | Concurrent rendering default, actions API, new hooks |
| Tailwind v3 | Tailwind v4 | 2025 | New configuration format, OKLCH colors |
| TanStack Table v7 | TanStack Table v8 | 2022 | v7 deprecated, v8 has better TypeScript and hooks |
| Class components + withMsal | Functional + hooks | 2020+ | useMsal, useIsAuthenticated are standard |

**Deprecated/outdated:**
- **passport-azure-ad**: Archived and unmaintained, use manual JWT validation instead
- **react-table v7**: Use @tanstack/react-table (v8)
- **Serial types in PostgreSQL**: Use generatedAlwaysAsIdentity()
- **forwardRef in React 19**: Refs are now regular props
- **MSAL withMsal HOC**: Use useMsal() hook instead
- **String refs in React**: Use ref callbacks or useRef

## Open Questions

Things that couldn't be fully resolved:

1. **MSAL React + React 19 Compatibility**
   - What we know: GitHub issues open as of Feb 2025 requesting React 19 peer dependency support
   - What's unclear: Whether runtime issues exist or just peer dependency warnings
   - Recommendation: Use `--legacy-peer-deps` and test thoroughly, monitor [issue #7577](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/7577)

2. **Tailwind v4 + shadcn/ui Stability**
   - What we know: shadcn CLI can initialize with Tailwind v4, OKLCH color conversion
   - What's unclear: Whether all shadcn components are fully tested with Tailwind v4
   - Recommendation: Follow [shadcn Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4), test components thoroughly

3. **Power BI Snowflake View Integration**
   - What we know: PostgreSQL supports views, Power BI can connect to PostgreSQL
   - What's unclear: Specific snowflake schema patterns for Phase 1 referentials
   - Recommendation: Defer detailed view design to Phase 2 when report requirements are clear

4. **Currency Conversion Implementation**
   - What we know: Store currency at source, convert only for reporting (per STATE.md)
   - What's unclear: Where conversion happens (frontend, backend, Power BI layer)
   - Recommendation: Store raw values + currency code in Phase 1, implement conversion in reporting phase

## Sources

### Primary (HIGH confidence)

- [MSAL React Getting Started](https://learn.microsoft.com/en-us/entra/msal/javascript/react/getting-started) - Official Microsoft docs
- [Fastify Hooks Reference](https://fastify.dev/docs/latest/Reference/Hooks/) - Official Fastify docs
- [Drizzle ORM PostgreSQL Guide](https://orm.drizzle.team/docs/get-started/postgresql-new) - Official Drizzle docs
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/data-table) - Official shadcn docs
- [Drizzle PostgreSQL Best Practices](https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717) - Community gist, Dec 2025
- [MSAL Node NPM](https://www.npmjs.com/package/@azure/msal-node) - Official package docs
- [React 19 Release](https://react.dev/blog/2024/12/05/react-19) - Official React blog

### Secondary (MEDIUM confidence)

- [Verifying Azure AD JWT in Node.js](https://medium.com/@ketanpradhan/verifying-microsoft-azure-ad-jwt-tokens-in-node-js-d38f54cbb791) - Medium article
- [Fastify API with Drizzle ORM](https://dev.to/vladimirvovk/fastify-api-with-postgres-and-drizzle-orm-a7j) - DEV Community
- [Node.js Environment Variables 2026](https://oneuptime.com/blog/post/2026-01-06-nodejs-production-environment-variables/view) - Recent best practices
- [3 Biggest Mistakes with Drizzle ORM](https://medium.com/@lior_amsalem/3-biggest-mistakes-with-drizzle-orm-1327e2531aff) - Medium article
- [Fastify Authentication Strategy](https://daily.dev/blog/fastify-authentication-strategy) - Daily.dev

### Tertiary (LOW confidence)

- [React 19 peer dependency GitHub issues](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/7577) - Community reports
- [MSAL session persistence issue](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/6608) - Community reports
- Various Stack Overflow discussions on JWT validation patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official libraries documented, versions confirmed via NPM and official docs
- Architecture: HIGH - Patterns verified via Context7, official documentation, and community best practices
- Pitfalls: MEDIUM-HIGH - Based on GitHub issues, community reports, and official error documentation

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable ecosystem, though monitor MSAL React + React 19 compatibility)

**Key areas requiring validation:**
- MSAL React compatibility with React 19 (monitor GitHub issues)
- Tailwind v4 + shadcn/ui production stability (test thoroughly)
- Connection pool sizing for production workload (benchmark after deployment)
