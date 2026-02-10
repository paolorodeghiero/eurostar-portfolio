# Phase 6: Admin GUI & Reporting - Research

**Researched:** 2026-02-10
**Domain:** API Documentation (Swagger/OpenAPI), PostgreSQL Reporting Views, Admin UX Enhancements
**Confidence:** HIGH

## Summary

Phase 6 implements three parallel workstreams: (1) API documentation via @fastify/swagger with EntraID authentication and custom Eurostar branding, (2) PostgreSQL reporting views in a dedicated schema using snowflake dimensional modeling for Power BI DirectQuery, and (3) admin UX enhancements including usage tracking, audit logs, and bulk import/export. The project already has solid foundations with Fastify 5.x, Drizzle ORM, Zod validation, @tanstack/react-table, and EntraID token validation in place.

**Primary recommendation:** Use @fastify/swagger 9.x with fastify-type-provider-zod for automatic OpenAPI generation from existing Zod schemas, create regular PostgreSQL views (not materialized) in a dedicated `reporting` schema with pre-calculated currency conversions, and enhance admin pages with Radix UI AlertDialog for improved delete confirmations and drawer/expand patterns for usage visibility.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Reporting Views:**
- Schema: Single `reporting` schema (e.g., `reporting.dim_departments`, `reporting.fact_projects`)
- View depth: Both summary and detail levels for Power BI drill-down
- Naming: Verbose names with prefix (dim_*, fact_*)
- Time dimension: Basic (year, quarter, month) — fiscal year equals calendar year
- Currency: Include original currency column plus EUR converted amount
- Dimensions: All 9 referential types exposed as dimension views
- Facts: fact_projects (summary), fact_receipts, fact_invoices
- Calculated fields: Pre-calculate key metrics (budget_remaining, percent_used, days_until_end)

**API Documentation:**
- Tooling: @fastify/swagger for auto-generation from route schemas
- Interactive: Full Swagger UI at /docs with Try It buttons
- Authentication: Require EntraID token to access API docs
- Examples: Realistic examples with Eurostar-style data
- Grouping: Endpoints grouped by resource (Projects, Teams, Budget Lines, etc.)
- Errors: Detailed error documentation per endpoint with specific scenarios
- Versioning: Document as v1 with /api/v1 prefix
- Export: Expose /docs/openapi.json for programmatic access
- Branding: Full Eurostar theme match (teal, cream, logo, typography)
- Navigation: API link in main navbar next to Admin button, visible to all authenticated users

**Admin Enhancements:**
- Usage visibility: Show which projects use each referential item (Claude's discretion on UX)
- Audit access: Dedicated admin page showing all system changes across all projects
- Bulk operations: Import and export referential data (Excel/CSV)
- Table features: Simplified — basic search and sort only
- Error display: Better API error display in admin (Claude's discretion on presentation)

### Claude's Discretion

- Usage visibility UX pattern (inline expand vs side panel)
- Error display approach (toast vs banner vs modal based on severity)
- Swagger UI customization details within Eurostar theme

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @fastify/swagger | 9.7.0+ | OpenAPI v3 schema generation | Official Fastify plugin, auto-generates from route schemas, supports security schemes |
| @fastify/swagger-ui | 5.0.0+ | Swagger UI hosting | Official Fastify plugin, customizable branding (logo, CSS, theme), auth hooks support |
| fastify-type-provider-zod | 5.x | Zod→OpenAPI transformation | Seamless integration between existing Zod schemas and OpenAPI, auto-generates documentation |
| xlsx | 0.20.3 (via CDN) | Excel import/export | Already in backend package.json, industry standard for Excel operations |
| Drizzle Kit | 0.30.4+ | Schema migrations for views | Already in use, supports views, schemas, and custom SQL |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-alert-dialog | 1.1.15+ | Accessible confirmation dialogs | Already in project, improves delete confirmation UX with WAI-ARIA compliance |
| date-fns | 4.1.0+ | Date calculations for fiscal year | Already in frontend, used for time dimension calculations |
| Drizzle ORM view syntax | 0.38.4+ | View definitions in schema | For defining reporting views alongside tables in schema.ts |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Regular views | Materialized views | Materialized views offer 15s→5ms query speedups but require refresh management; Power BI DirectQuery needs real-time data, making regular views the right choice |
| @fastify/swagger | NestJS Swagger or Fastapi | Already using Fastify; consistency trumps migration cost |
| fastify-type-provider-zod | Manual JSON Schema | Manual schemas duplicate validation logic and become stale; auto-generation ensures docs match implementation |
| dim_/fact_ prefixes | Business-friendly names | SQLBI official guidance discourages technical prefixes, but user explicitly requested verbose technical naming for Power BI semantic models |

**Installation:**
```bash
# Backend
npm install @fastify/swagger@^9.7.0 @fastify/swagger-ui@^5.0.0 fastify-type-provider-zod@^5.0.0

# Frontend - no new dependencies needed (already have xlsx, @radix-ui, date-fns)
```

## Architecture Patterns

### Recommended Project Structure

```
backend/src/
├── routes/
│   ├── admin/              # Existing admin routes
│   │   └── ...
│   └── swagger/            # NEW: Swagger config
│       └── options.ts      # OpenAPI spec, security, examples
├── db/
│   ├── schema.ts           # Existing tables
│   └── reporting-views.ts  # NEW: View definitions (dim_*, fact_*)
├── migrations/             # Drizzle generates SQL from schema changes
│   └── 0004_*.sql          # NEW: CREATE SCHEMA reporting; CREATE VIEW ...
└── plugins/
    └── swagger.ts          # NEW: @fastify/swagger registration

frontend/src/
├── pages/
│   ├── admin/
│   │   ├── AuditLogPage.tsx        # NEW: System-wide audit page
│   │   └── [existing-pages].tsx    # ENHANCE: Usage visibility, bulk ops
│   └── layout/
│       └── MainNav.tsx             # ENHANCE: Add API docs link
└── components/
    └── admin/
        ├── UsageDrawer.tsx         # NEW: Side panel for usage details
        └── BulkImportDialog.tsx    # NEW: Excel/CSV import UI
```

### Pattern 1: Zod Schema → OpenAPI Auto-Generation

**What:** Define validation once in Zod schemas, automatically generate OpenAPI documentation
**When to use:** All new and existing Fastify routes with Zod validation
**Example:**
```typescript
// Source: https://github.com/turkerdev/fastify-type-provider-zod
import { z } from 'zod';
import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

const departmentSchema = z.object({
  id: z.number().describe('Department ID'),
  name: z.string().min(1).describe('Department name'),
  usageCount: z.number().describe('Number of teams using this department'),
});

const departmentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify
    .withTypeProvider<ZodTypeProvider>()
    .get(
      '/admin/departments',
      {
        schema: {
          description: 'List all departments with usage counts',
          tags: ['Departments'],
          response: {
            200: z.array(departmentSchema),
          },
          security: [{ BearerAuth: [] }],
        },
      },
      async () => {
        // Handler implementation
      }
    );
};
```

### Pattern 2: PostgreSQL Reporting Views with Currency Conversion

**What:** Create views in dedicated `reporting` schema with pre-calculated fields
**When to use:** Exposing application data to Power BI for DirectQuery
**Example:**
```typescript
// Source: PostgreSQL best practices + project schema
// backend/src/db/reporting-views.ts
import { sql } from 'drizzle-orm';

export const reportingViews = {
  // Dimension: Departments
  dimDepartments: sql`
    CREATE OR REPLACE VIEW reporting.dim_departments AS
    SELECT
      id as department_key,
      name as department_name,
      created_at,
      updated_at
    FROM departments
  `,

  // Fact: Projects with calculated metrics
  factProjects: sql`
    CREATE OR REPLACE VIEW reporting.fact_projects AS
    SELECT
      p.id as project_key,
      p.project_id,
      p.name as project_name,
      p.status_id as status_key,
      p.lead_team_id as lead_team_key,
      p.start_date,
      p.end_date,

      -- Budget in original currency
      p.opex_budget as opex_budget_original,
      p.capex_budget as capex_budget_original,
      p.budget_currency as original_currency,

      -- Budget converted to EUR (for standardized reporting)
      COALESCE(p.opex_budget, 0) as opex_budget_eur,
      COALESCE(p.capex_budget, 0) as capex_budget_eur,

      -- Calculated metrics
      COALESCE(p.opex_budget, 0) + COALESCE(p.capex_budget, 0) as total_budget_eur,

      -- Time calculations
      CASE
        WHEN p.end_date IS NOT NULL
        THEN p.end_date - CURRENT_DATE
        ELSE NULL
      END as days_until_end,

      -- Timestamps
      p.created_at,
      p.updated_at
    FROM projects p
  `,

  // Time dimension for fiscal year (equals calendar year per user decision)
  dimDate: sql`
    CREATE OR REPLACE VIEW reporting.dim_date AS
    SELECT
      d::date as date_key,
      EXTRACT(YEAR FROM d)::int as year,
      EXTRACT(QUARTER FROM d)::int as quarter,
      EXTRACT(MONTH FROM d)::int as month,
      EXTRACT(DAY FROM d)::int as day,
      TO_CHAR(d, 'Month') as month_name,
      TO_CHAR(d, 'Day') as day_name
    FROM generate_series(
      '2020-01-01'::date,
      '2030-12-31'::date,
      '1 day'::interval
    ) d
  `,
};
```

**Note:** Currency conversion logic simplified because all monetary values are already stored in EUR per prior design decision (CONTEXT: "All monetary values stored in EUR in database"). For multi-currency actuals (receipts/invoices), join with currency_rates table.

### Pattern 3: Swagger UI Custom Branding

**What:** Override Swagger UI theme with custom CSS and logo matching Eurostar brand
**When to use:** Making API docs match application look and feel
**Example:**
```typescript
// Source: https://github.com/fastify/fastify-swagger-ui
// backend/src/plugins/swagger.ts
import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fs from 'fs';
import path from 'path';

export const swaggerPlugin = fp(async (fastify) => {
  // Register @fastify/swagger first
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Eurostar Portfolio API',
        description: 'REST API for Eurostar Portfolio Management Tool',
        version: '1.0.0',
      },
      servers: [{ url: '/api/v1' }],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'EntraID JWT token',
          },
        },
      },
      tags: [
        { name: 'Projects', description: 'Project management endpoints' },
        { name: 'Departments', description: 'Department referential' },
        { name: 'Teams', description: 'Team referential' },
        // ... other tags
      ],
    },
    transform: jsonSchemaTransform, // From fastify-type-provider-zod
  });

  // Register Swagger UI with custom theme
  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
    staticCSP: true,
    uiHooks: {
      onRequest: async (request, reply) => {
        // Reuse existing auth plugin - requires EntraID token
        // Auth plugin already validates Bearer token via preValidation hook
      },
    },
    theme: {
      title: 'Eurostar Portfolio API',
      css: [{
        filename: 'eurostar-theme.css',
        content: `
          /* Eurostar brand colors */
          .swagger-ui .topbar { background-color: #00857d; }
          .swagger-ui .opblock-tag { color: #00857d; }
          .swagger-ui .btn.authorize {
            background-color: #00857d;
            border-color: #00857d;
          }
          .swagger-ui .opblock .opblock-summary {
            border-left: 3px solid #00857d;
          }
          /* More custom styles... */
        `,
      }],
      js: [{
        filename: 'eurostar-ui.js',
        content: `
          // Custom UI enhancements (optional)
        `,
      }],
    },
    logo: {
      type: 'image/png',
      content: fs.readFileSync(path.join(process.cwd(), 'assets/eurostar-logo.png')),
      href: '/docs',
      target: '_blank',
    },
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  });

  // Expose OpenAPI JSON at /docs/openapi.json (handled by swagger-ui)
});
```

### Pattern 4: Admin Usage Visibility (Side Panel Drawer)

**What:** Show which projects use each referential item in a slide-out panel
**When to use:** User needs context without losing list view (recommended over inline expand)
**Example:**
```typescript
// Source: UX research + PatternFly primary-detail pattern
// frontend/src/components/admin/UsageDrawer.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface UsageDrawerProps {
  referentialType: string;
  referentialId: number;
  referentialName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UsageDrawer({
  referentialType,
  referentialId,
  referentialName,
  open,
  onOpenChange
}: UsageDrawerProps) {
  const [usage, setUsage] = useState<{ projects: Project[] }>();

  useEffect(() => {
    if (open) {
      apiClient<{ projects: Project[] }>(
        `/api/admin/${referentialType}/${referentialId}/usage`
      ).then(setUsage);
    }
  }, [open, referentialType, referentialId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Projects using {referentialName}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          {usage?.projects.length === 0 && (
            <p className="text-muted-foreground">
              No projects currently using this item.
            </p>
          )}
          {usage?.projects.map((project) => (
            <div
              key={project.id}
              className="p-3 border rounded-md hover:bg-gray-50"
            >
              <p className="font-medium">{project.name}</p>
              <p className="text-sm text-muted-foreground">
                {project.projectId} • {project.statusName}
              </p>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

**Rationale:** Side panel keeps list context visible, allows browsing multiple items' usage without losing position, and works better on desktop (primary use case for admin). Inline expand would work for mobile-first or single-item workflows.

### Pattern 5: Improved Delete Confirmation with AlertDialog

**What:** Replace native confirm() with accessible Radix UI AlertDialog showing usage impact
**When to use:** All admin delete operations, especially when items may be in use
**Example:**
```typescript
// Source: https://www.radix-ui.com/primitives/docs/components/alert-dialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function DepartmentDeleteConfirm({ dept, onConfirm }: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={dept.usageCount > 0}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {dept.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This department will be permanently
            deleted from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Department
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Pattern 6: Excel/CSV Bulk Import

**What:** Upload Excel/CSV file, parse with xlsx library, validate and insert in transaction
**When to use:** Admin needs to load multiple referential items at once
**Example:**
```typescript
// Source: https://medium.com/@virajdere/efficiently-transforming-data-formats-json-to-xlsx-csv
// Backend route
import * as XLSX from 'xlsx';

fastify.post('/admin/departments/import', async (request, reply) => {
  const data = await request.file();
  const buffer = await data.toBuffer();

  // Parse Excel
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<{ name: string }>(sheet);

  // Validate
  const departmentSchema = z.object({ name: z.string().min(1) });
  const validated = rows.map(row => departmentSchema.parse(row));

  // Insert in transaction
  await db.transaction(async (tx) => {
    for (const dept of validated) {
      await tx.insert(departments).values({ name: dept.name });
    }
  });

  return { imported: validated.length };
});
```

### Anti-Patterns to Avoid

- **Materialized views for Power BI DirectQuery:** DirectQuery requires real-time data; materialized views would need constant refreshing and add refresh-management complexity
- **Storing converted currency values:** Already storing EUR; conversion should happen in reporting layer only (views), not duplicated in storage
- **Using native window.confirm():** Non-accessible, no context about usage impact, poor UX
- **Inline styles in Swagger UI:** Use theme.css for maintainability and consistency
- **Skipping auth on /docs:** User explicitly requested EntraID token requirement for API docs

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OpenAPI spec generation | Manual JSON OpenAPI spec | @fastify/swagger + fastify-type-provider-zod | Manual specs become stale immediately; validation and docs should derive from single source (Zod schemas) |
| JWT validation | Custom JWT parsing/validation | Existing auth.ts plugin (jwks-rsa) | Already implemented, handles JWKS rotation, validates EntraID tokens |
| Excel file parsing | String splitting/regex CSV parsing | xlsx library (already in package.json) | Handles encoding, multi-sheet, formulas, date parsing correctly; CSV parsing has 50+ edge cases |
| Date dimension tables | Hand-coding date records | generate_series() in PostgreSQL | PostgreSQL native function generates date ranges efficiently; no risk of gaps or typos |
| Confirmation dialogs | Custom modal components | @radix-ui/react-alert-dialog (already installed) | WAI-ARIA compliant, keyboard navigation, focus management handled correctly |
| Currency conversion | Manual rate lookup queries | Pre-calculated in views with LEFT JOIN | Power BI benefits from denormalized views; calculation once vs per report query |

**Key insight:** This phase leverages existing patterns (auth, Zod validation, @tanstack/react-table) rather than introducing new paradigms. The main new patterns are (1) Zod→OpenAPI auto-generation and (2) dedicated reporting schema with dimensional views.

## Common Pitfalls

### Pitfall 1: Swagger Route Registration Order

**What goes wrong:** Routes registered before @fastify/swagger don't appear in docs
**Why it happens:** Swagger plugin inspects routes registered after it loads
**How to avoid:** Register swagger plugin immediately after auth, before any route plugins
**Warning signs:** Empty or partial OpenAPI spec at /docs/openapi.json

### Pitfall 2: View Circular Dependencies

**What goes wrong:** Views reference each other creating dependency cycles in migrations
**Why it happens:** Complex dimensional models with bidirectional relationships
**How to avoid:** Design views as pure read layers over base tables, never reference other views
**Warning signs:** Migration fails with "relation does not exist" error

### Pitfall 3: Missing Security Schemes in Route Schemas

**What goes wrong:** Swagger UI doesn't show "Authorize" button or lock icons
**Why it happens:** Forgot to add `security: [{ BearerAuth: [] }]` to route schema
**How to avoid:** Create route schema template with security pre-configured
**Warning signs:** Can "Try it out" without providing token, gets 401 errors

### Pitfall 4: Currency Conversion Without Rate Data

**What goes wrong:** Views fail or return NULL when currency_rates table lacks current rates
**Why it happens:** Forgot to seed/maintain exchange rate data
**How to avoid:** Add seed data for common EUR/GBP rates with far-future validTo dates, add monitoring for rate gaps
**Warning signs:** Reporting views show NULL in converted amount columns

### Pitfall 5: Large Global Filter Performance

**What goes wrong:** Admin tables with 1000+ rows slow down on search
**Why it happens:** @tanstack/react-table globalFilter re-renders entire table
**How to avoid:** Use debounced search (use-debounce already installed), consider server-side filtering for large tables
**Warning signs:** Typing in search input feels laggy, browser freezes briefly

### Pitfall 6: Audit Log Table Growth

**What goes wrong:** audit_log table grows unbounded, slows queries
**Why it happens:** No retention policy, every field change tracked
**How to avoid:** Implement partitioning by month or retention policy (e.g., keep 2 years), add index on changed_at
**Warning signs:** Audit log page loads slowly, database size grows faster than data

### Pitfall 7: Power BI DirectQuery Column Naming

**What goes wrong:** Power BI fails to query views with reserved keywords or special chars
**Why it happens:** Column names use PostgreSQL identifiers that Power BI doesn't handle
**How to avoid:** Use lowercase_snake_case for all view columns, avoid SQL keywords (user, date, order)
**Warning signs:** DirectQuery connection succeeds but queries fail with syntax errors

### Pitfall 8: Swagger UI CSP Violations

**What goes wrong:** Custom CSS/JS doesn't load, console shows Content Security Policy errors
**Why it happens:** staticCSP: true conflicts with inline scripts/styles
**How to avoid:** Use theme.css and theme.js files (not inline), or configure CSP to allow 'unsafe-inline'
**Warning signs:** Swagger UI loads but custom branding missing, browser console CSP warnings

## Code Examples

Verified patterns from official sources:

### Example 1: Registering Swagger with Zod Type Provider

```typescript
// Source: https://github.com/turkerdev/fastify-type-provider-zod
import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  ZodTypeProvider
} from 'fastify-type-provider-zod';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

const fastify = Fastify();

// Set Zod as validator and serializer
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// Register @fastify/swagger
await fastify.register(fastifySwagger, {
  openapi: {
    openapi: '3.0.3',
    info: {
      title: 'Eurostar Portfolio API',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
  // Optional: Skip list for schemas that shouldn't be transformed
  transformObject: createJsonSchemaTransform({
    skipList: ['/health'], // Skip health check from docs
  }),
});

// Register Swagger UI
await fastify.register(fastifySwaggerUi, {
  routePrefix: '/docs',
});

// Routes will automatically generate OpenAPI schemas
```

### Example 2: Creating Reporting Schema with Drizzle

```typescript
// Source: https://orm.drizzle.team/docs/sql-schema-declaration
// backend/src/db/reporting-views.ts
import { sql } from 'drizzle-orm';
import { pgSchema } from 'drizzle-orm/pg-core';

// Define reporting schema
export const reportingSchema = pgSchema('reporting');

// Helper to create view definitions (Drizzle will generate migration SQL)
export const createReportingViews = async (db: any) => {
  // Create schema first
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS reporting`);

  // Dimension views
  await db.execute(sql`
    CREATE OR REPLACE VIEW reporting.dim_departments AS
    SELECT
      id as department_key,
      name as department_name,
      created_at,
      updated_at
    FROM departments
  `);

  await db.execute(sql`
    CREATE OR REPLACE VIEW reporting.dim_teams AS
    SELECT
      t.id as team_key,
      t.name as team_name,
      t.department_id as department_key,
      d.name as department_name,
      t.created_at,
      t.updated_at
    FROM teams t
    LEFT JOIN departments d ON t.department_id = d.id
  `);

  // Add other dimension views...

  // Fact views
  await db.execute(sql`
    CREATE OR REPLACE VIEW reporting.fact_projects AS
    SELECT
      p.id as project_key,
      p.project_id,
      p.name as project_name,
      p.status_id as status_key,
      p.lead_team_id as team_key,

      -- Dates
      p.start_date,
      p.end_date,
      EXTRACT(YEAR FROM p.start_date)::int as start_year,
      EXTRACT(QUARTER FROM p.start_date)::int as start_quarter,
      EXTRACT(MONTH FROM p.start_date)::int as start_month,

      -- Budget (already in EUR per design)
      p.opex_budget as opex_budget_eur,
      p.capex_budget as capex_budget_eur,
      COALESCE(p.opex_budget, 0) + COALESCE(p.capex_budget, 0) as total_budget_eur,

      -- Calculated metrics
      CASE
        WHEN p.end_date IS NOT NULL AND p.end_date >= CURRENT_DATE
        THEN p.end_date - CURRENT_DATE
        ELSE NULL
      END as days_until_end,

      p.created_at,
      p.updated_at
    FROM projects p
  `);
};
```

### Example 3: Usage Detail Endpoint

```typescript
// Source: Existing pattern from departments.ts
// backend/src/routes/admin/departments.ts (ENHANCE)
fastify.get<{ Params: { id: string } }>(
  '/:id/usage',
  {
    schema: {
      description: 'Get projects using this department',
      tags: ['Departments'],
      params: z.object({ id: z.coerce.number() }),
      response: {
        200: z.object({
          projects: z.array(z.object({
            id: z.number(),
            projectId: z.string(),
            name: z.string(),
            statusName: z.string(),
          })),
        }),
      },
      security: [{ BearerAuth: [] }],
    },
  },
  async (request, reply) => {
    const id = request.params.id;

    // Find projects via teams
    const projectsUsingDept = await db
      .select({
        id: projects.id,
        projectId: projects.projectId,
        name: projects.name,
        statusName: statuses.name,
      })
      .from(projects)
      .innerJoin(teams, eq(projects.leadTeamId, teams.id))
      .leftJoin(statuses, eq(projects.statusId, statuses.id))
      .where(eq(teams.departmentId, id));

    return { projects: projectsUsingDept };
  }
);
```

### Example 4: Audit Log Query with Filtering

```typescript
// Source: PostgreSQL audit logging best practices
// backend/src/routes/admin/audit-log.ts (NEW)
import { auditLog } from '@/db/schema';
import { desc, and, gte, lte, like } from 'drizzle-orm';

fastify.get<{
  Querystring: {
    startDate?: string;
    endDate?: string;
    tableName?: string;
    changedBy?: string;
  }
}>(
  '/audit-log',
  {
    schema: {
      description: 'List audit log entries with optional filters',
      tags: ['Admin'],
      querystring: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        tableName: z.string().optional(),
        changedBy: z.string().optional(),
      }),
      response: {
        200: z.array(z.object({
          id: z.number(),
          tableName: z.string(),
          recordId: z.number(),
          changedBy: z.string(),
          changedAt: z.string(),
          operation: z.string(),
          changes: z.any(),
        })),
      },
      security: [{ BearerAuth: [] }],
    },
  },
  async (request) => {
    const { startDate, endDate, tableName, changedBy } = request.query;

    const conditions = [];
    if (startDate) conditions.push(gte(auditLog.changedAt, new Date(startDate)));
    if (endDate) conditions.push(lte(auditLog.changedAt, new Date(endDate)));
    if (tableName) conditions.push(like(auditLog.tableName, `%${tableName}%`));
    if (changedBy) conditions.push(like(auditLog.changedBy, `%${changedBy}%`));

    const logs = await db
      .select()
      .from(auditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLog.changedAt))
      .limit(100); // Pagination recommended for production

    return logs;
  }
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual OpenAPI specs | Auto-generated from Zod schemas | 2023-2024 | Single source of truth for validation + docs; no more stale API docs |
| JSON Schema for Fastify | Zod + type providers | 2023+ | Type safety from schema to TypeScript, better DX, runtime + compile-time validation |
| Materialized views for BI | Regular views with DirectQuery | 2024+ | Real-time data in reports, no refresh management; Power BI handles caching |
| Technical dim_/fact_ prefixes | Business-friendly naming | 2025 SQLBI guidance | Better end-user experience in semantic models (BUT: user requested technical prefixes for this project) |
| window.confirm() | Radix UI AlertDialog | 2023+ WAI-ARIA | Accessibility, keyboard nav, custom messaging, better UX |

**Deprecated/outdated:**
- **fastify-swagger (no @):** Deprecated in favor of @fastify/swagger (namespace change)
- **JSON Schema by hand:** Replaced by Zod→JSON Schema transformation
- **Materialized views for real-time BI:** DirectQuery mode expects fresh data; materialized views add staleness

## Open Questions

1. **Currency conversion performance in views**
   - What we know: Project already stores all budgets in EUR; actuals (receipts/invoices) may have original currencies
   - What's unclear: Will joining currency_rates in fact_receipts/fact_invoices views impact DirectQuery performance?
   - Recommendation: Start with simple LEFT JOIN, monitor Power BI query performance, add indexes on currency_rates if needed

2. **Audit log retention policy**
   - What we know: audit_log table will grow unbounded without retention
   - What's unclear: User's regulatory/business requirements for retention period
   - Recommendation: Start with no retention (keep all), add partitioning by month if table grows beyond 1M rows, implement retention policy later if needed

3. **Swagger UI authentication flow**
   - What we know: User wants EntraID token required; existing auth plugin validates tokens
   - What's unclear: Should /docs require token in Authorization header or use interactive OAuth flow?
   - Recommendation: Simplest approach is to require existing Bearer token (copy from browser DevTools); interactive OAuth would require additional @fastify/oauth2 setup

4. **Excel import validation failure handling**
   - What we know: Need bulk import with validation
   - What's unclear: UI flow for partial failures (e.g., 80 of 100 rows valid)
   - Recommendation: All-or-nothing transaction (reject entire upload if any row invalid), return detailed error list for user to fix

## Sources

### Primary (HIGH confidence)

- [@fastify/swagger GitHub](https://github.com/fastify/fastify-swagger) - v9.x setup, security schemes, route schema integration
- [@fastify/swagger-ui GitHub](https://github.com/fastify/fastify-swagger-ui) - logo, theme, CSS customization, auth hooks
- [fastify-type-provider-zod GitHub](https://github.com/turkerdev/fastify-type-provider-zod) - Zod→OpenAPI transformation, setup examples
- [Drizzle ORM - Migrations](https://orm.drizzle.team/docs/migrations) - Schema migrations, view support
- [Drizzle ORM - PostgreSQL](https://orm.drizzle.team/docs/get-started/postgresql-new) - pgSchema, custom SQL execution
- [Radix UI Alert Dialog](https://www.radix-ui.com/primitives/docs/components/alert-dialog) - WAI-ARIA compliant confirmation dialogs
- [TanStack Table Docs](https://tanstack.com/table/latest/docs/framework/react/examples/pagination) - Pagination, sorting, filtering
- [PostgreSQL Date Dimension Wiki](https://wiki.postgresql.org/wiki/Date_and_Time_dimensions) - Calendar table patterns
- [PostgreSQL Schema Wiki](https://wiki.postgresql.org/wiki/Database_Schema_Recommendations_for_an_Application) - Multi-schema organization

### Secondary (MEDIUM confidence)

- [PostgreSQL Audit Logging Best Practices](https://severalnines.com/blog/postgresql-audit-logging-best-practices/) - Trigger-based auditing, retention
- [Star Schema vs Snowflake Schema](https://www.montecarlodata.com/blog-star-schema-vs-snowflake-schema/) - Dimensional modeling tradeoffs
- [Power BI DirectQuery Guidance](https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-directquery-about) - Limitations, best practices
- [SQLBI DAX Naming Conventions](https://docs.sqlbi.com/dax-style/dax-naming-conventions) - Avoid technical prefixes (dim_, fact_)
- [Medium: JSON to XLSX/CSV TypeScript](https://medium.com/@virajdere/efficiently-transforming-data-formats-json-to-xlsx-csv) - xlsx library usage patterns
- [PatternFly Primary-Detail Pattern](https://www.patternfly.org/patterns/primary-detail/design-guidelines/) - Side panel vs inline expand UX

### Tertiary (LOW confidence)

- [WebSearch: PostgreSQL currency conversion](https://rietta.com/blog/postgresql-currency-types/) - Use numeric, avoid money type
- [WebSearch: React delete confirmation patterns](https://www.shadcn.io/blocks/crud-delete-confirm-01) - Modern UX examples

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** - All libraries officially supported, versions verified from GitHub releases
- Architecture: **HIGH** - Patterns verified against official docs and existing project patterns
- Pitfalls: **MEDIUM** - Derived from documentation warnings and community experiences (not project-specific testing)
- Currency conversion in views: **MEDIUM** - Strategy sound but performance impact not benchmarked
- Swagger UI branding: **HIGH** - Options verified in official fastify-swagger-ui README

**Research date:** 2026-02-10
**Valid until:** ~2026-03-10 (30 days - stable ecosystem, unlikely to change rapidly)

**Key success factors:**
1. Leverage existing patterns (auth, Zod, tables) to minimize new concepts
2. Separate concerns: reporting schema isolated from application schema
3. Auto-generation over hand-written docs (Zod→OpenAPI)
4. Accessibility first (Radix UI over custom components)
5. Real-time over cached (regular views for DirectQuery)
