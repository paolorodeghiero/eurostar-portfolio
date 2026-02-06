# Phase 4: Governance & Workflow - Research

**Researched:** 2026-02-06
**Domain:** Workflow state machines, audit history tracking, file uploads, alert generation
**Confidence:** HIGH

## Summary

Phase 4 implements engagement committee workflow, comprehensive audit trails, business case file uploads, and alert generation. The research reveals that TypeScript discriminated unions provide compile-time safety for simple workflow state machines without library overhead, PostgreSQL audit triggers with JSONB storage offer robust change tracking, @fastify/multipart (already installed v9.4.0) handles file uploads efficiently, and Drizzle ORM query operators enable straightforward alert detection queries.

The committee workflow (Draft→Presented→Discussion→Approved/Rejected) is simple enough for a custom TypeScript state machine using discriminated unions rather than a library like XState. Audit history uses PostgreSQL triggers storing changes as JSONB for schema flexibility. File uploads leverage the existing @fastify/multipart package with local filesystem storage (not database BLOB storage). Alerts are computed queries using Drizzle's date comparison operators.

**Primary recommendation:** Use lightweight TypeScript patterns (discriminated unions for workflow, PostgreSQL triggers for audit, Drizzle queries for alerts) rather than heavy libraries. This aligns with the project's existing architecture and avoids unnecessary complexity.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @fastify/multipart | 9.4.0 | File upload handling | Already installed, official Fastify plugin for multipart forms |
| PostgreSQL Triggers | Native | Audit trail capture | Database-level consistency, atomic with transactions |
| Drizzle ORM | 0.38.4 | Query building with operators | Already in use, provides `gt`, `lt`, `lte` for date comparisons |
| TypeScript Discriminated Unions | Native | Type-safe state machines | Zero dependencies, compile-time guarantees |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @fastify/static | Latest | Serve uploaded files | Only if serving files directly from Fastify (not recommended for production) |
| zod | 4.3.6 | Workflow transition validation | Already installed, validate state transitions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Discriminated unions | XState v5 | XState adds 10KB+ bundle, overkill for 4-state linear workflow |
| PostgreSQL triggers | Application-level logging | Triggers guarantee capture, can't be bypassed by direct DB access |
| Local filesystem | AWS S3 / Azure Blob | Local simpler for MVP, S3 better for production scale |

**Installation:**
```bash
# All core dependencies already installed
# Optional for serving files:
npm install @fastify/static
```

## Architecture Patterns

### Recommended Project Structure
```
backend/src/
├── routes/
│   ├── committee/            # Committee workflow endpoints
│   │   ├── index.ts         # POST /api/committee/transition
│   │   └── workflow.ts      # State machine logic
│   ├── audit/               # Audit history endpoints
│   │   └── history.ts       # GET /api/projects/:id/history
│   ├── alerts/              # Alert generation endpoints
│   │   └── index.ts         # GET /api/alerts
│   └── uploads/             # Business case file uploads
│       └── business-case.ts # POST /api/projects/:id/business-case
├── lib/
│   └── committee-workflow.ts # Workflow state machine types
└── db/
    ├── schema.ts            # Add: project_committee_workflow, project_audit_log, project_files
    └── migrations/
        └── 0006_*.sql       # Audit trigger SQL

uploads/                     # Local file storage directory
└── business-cases/
    └── {projectId}/
        └── {filename}
```

### Pattern 1: TypeScript Discriminated Union State Machine
**What:** Type-safe workflow using union types and exhaustive checking
**When to use:** Linear workflows with few states (< 10), no hierarchical states
**Example:**
```typescript
// Source: Research findings from Medium articles on TypeScript state machines

// Define states as discriminated union
type CommitteeState =
  | { status: 'draft'; step: null }
  | { status: 'presented'; presentedAt: Date; presentedBy: string }
  | { status: 'discussion'; discussionStartedAt: Date }
  | { status: 'approved'; approvedAt: Date; approvedBy: string }
  | { status: 'rejected'; rejectedAt: Date; rejectedBy: string; reason: string };

// Define valid transitions
type Transition =
  | { from: 'draft'; to: 'presented'; presentedBy: string }
  | { from: 'presented'; to: 'discussion' }
  | { from: 'discussion'; to: 'approved'; approvedBy: string }
  | { from: 'discussion'; to: 'rejected'; rejectedBy: string; reason: string };

// Transition function with exhaustive checking
function transition(
  current: CommitteeState,
  transition: Transition
): CommitteeState {
  // TypeScript ensures all cases handled
  switch (current.status) {
    case 'draft':
      if (transition.from === 'draft' && transition.to === 'presented') {
        return {
          status: 'presented',
          presentedAt: new Date(),
          presentedBy: transition.presentedBy
        };
      }
      throw new Error('Invalid transition from draft');

    case 'presented':
      if (transition.from === 'presented' && transition.to === 'discussion') {
        return {
          status: 'discussion',
          discussionStartedAt: new Date()
        };
      }
      throw new Error('Invalid transition from presented');

    case 'discussion':
      if (transition.from === 'discussion' && transition.to === 'approved') {
        return {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: transition.approvedBy
        };
      }
      if (transition.from === 'discussion' && transition.to === 'rejected') {
        return {
          status: 'rejected',
          rejectedAt: new Date(),
          rejectedBy: transition.rejectedBy,
          reason: transition.reason
        };
      }
      throw new Error('Invalid transition from discussion');

    case 'approved':
    case 'rejected':
      throw new Error('Cannot transition from terminal state');

    default:
      // Exhaustive check - TypeScript errors if case missing
      const _exhaustive: never = current;
      throw new Error('Unhandled state');
  }
}
```

### Pattern 2: PostgreSQL Audit Trigger with JSONB
**What:** Database trigger capturing all changes to projects table
**When to use:** Row-level audit trails for compliance and history
**Example:**
```sql
-- Source: PostgreSQL Wiki Audit Trigger pattern

-- Audit table schema
CREATE TABLE project_audit_log (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  project_id integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  operation_type varchar(10) NOT NULL, -- INSERT, UPDATE, DELETE
  changed_at timestamp NOT NULL DEFAULT now(),
  changed_by varchar(255) NOT NULL,
  field_name varchar(100), -- Specific field changed (for UPDATE)
  old_value jsonb, -- Previous value
  new_value jsonb, -- New value
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_audit_project_id ON project_audit_log(project_id);
CREATE INDEX idx_project_audit_changed_at ON project_audit_log(changed_at DESC);

-- Trigger function to log changes
CREATE OR REPLACE FUNCTION audit_project_changes()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
BEGIN
  -- Get user from current_setting (set by application)
  user_email := current_setting('app.current_user', true);
  IF user_email IS NULL THEN
    user_email := 'system';
  END IF;

  IF (TG_OP = 'UPDATE') THEN
    -- Log each changed field separately
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      INSERT INTO project_audit_log (project_id, operation_type, changed_by, field_name, old_value, new_value)
      VALUES (NEW.id, 'UPDATE', user_email, 'name', to_jsonb(OLD.name), to_jsonb(NEW.name));
    END IF;

    IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
      INSERT INTO project_audit_log (project_id, operation_type, changed_by, field_name, old_value, new_value)
      VALUES (NEW.id, 'UPDATE', user_email, 'status_id', to_jsonb(OLD.status_id), to_jsonb(NEW.status_id));
    END IF;

    -- Add similar blocks for all tracked fields

    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO project_audit_log (project_id, operation_type, changed_by, field_name, new_value)
    VALUES (NEW.id, 'INSERT', user_email, NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO project_audit_log (project_id, operation_type, changed_by, field_name, old_value)
    VALUES (OLD.id, 'DELETE', user_email, NULL, to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to projects table
CREATE TRIGGER projects_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON projects
FOR EACH ROW EXECUTE FUNCTION audit_project_changes();
```

### Pattern 3: File Upload with @fastify/multipart
**What:** Handle business case file uploads with validation
**When to use:** Single/multiple file uploads with metadata
**Example:**
```typescript
// Source: Fastify multipart documentation and best practices

import type { FastifyInstance } from 'fastify';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function businessCaseRoutes(fastify: FastifyInstance) {
  const UPLOAD_DIR = join(process.cwd(), 'uploads', 'business-cases');

  // POST /api/projects/:id/business-case - Upload business case file
  fastify.post<{ Params: { id: string } }>(
    '/:id/business-case',
    async (request, reply) => {
      const projectId = parseInt(request.params.id);

      // Verify project exists
      const [project] = await fastify.db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId));

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      // Get uploaded file
      const data = await request.file({
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB max
        }
      });

      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      // Validate file type (PDF, DOCX, XLSX)
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!allowedTypes.includes(data.mimetype)) {
        return reply.code(400).send({
          error: 'Invalid file type. Only PDF, DOCX, and XLSX allowed'
        });
      }

      // Create project-specific directory
      const projectDir = join(UPLOAD_DIR, projectId.toString());
      await mkdir(projectDir, { recursive: true });

      // Generate safe filename
      const timestamp = Date.now();
      const safeFilename = `${timestamp}-${data.filename}`;
      const filepath = join(projectDir, safeFilename);

      // Stream file to disk
      await pipeline(data.file, createWriteStream(filepath));

      // Store file metadata in database
      const userEmail = request.user?.email || 'system';
      const [fileRecord] = await fastify.db
        .insert(projectFiles)
        .values({
          projectId,
          filename: data.filename,
          storedFilename: safeFilename,
          filepath: filepath,
          mimetype: data.mimetype,
          size: data.file.bytesRead,
          uploadedBy: userEmail,
        })
        .returning();

      return reply.code(201).send(fileRecord);
    }
  );

  // GET /api/projects/:id/business-case/:fileId/download
  fastify.get<{
    Params: { id: string; fileId: string }
  }>('/:id/business-case/:fileId/download', async (request, reply) => {
    const projectId = parseInt(request.params.id);
    const fileId = parseInt(request.params.fileId);

    const [file] = await fastify.db
      .select()
      .from(projectFiles)
      .where(and(
        eq(projectFiles.projectId, projectId),
        eq(projectFiles.id, fileId)
      ));

    if (!file) {
      return reply.code(404).send({ error: 'File not found' });
    }

    // Send file with original filename
    return reply.sendFile(file.storedFilename, join(UPLOAD_DIR, projectId.toString()), {
      headers: {
        'Content-Disposition': `attachment; filename="${file.filename}"`
      }
    });
  });
}
```

### Pattern 4: Alert Detection Queries
**What:** Query-based alert detection for overdue projects and budget limits
**When to use:** Periodic checks or on-demand alert retrieval
**Example:**
```typescript
// Source: Drizzle ORM operators documentation

import { gt, lt, lte, and, or, sql } from 'drizzle-orm';

// GET /api/alerts - Get all active alerts
async function getAlerts(db: Database) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  // Query 1: Overdue projects (end date passed, not completed)
  const overdueProjects = await db
    .select({
      id: projects.id,
      projectId: projects.projectId,
      name: projects.name,
      endDate: projects.endDate,
      statusName: statuses.name,
      type: sql<string>`'overdue'`,
      severity: sql<string>`'high'`,
      message: sql<string>`'Project is overdue'`,
    })
    .from(projects)
    .leftJoin(statuses, eq(projects.statusId, statuses.id))
    .where(
      and(
        lt(projects.endDate, today), // End date is in the past
        eq(projects.isStopped, false), // Not stopped
        // Assuming status 'Completed' has specific ID or name
        sql`${statuses.name} != 'Completed'`
      )
    );

  // Query 2: Projects approaching budget limit (>90% spent)
  const budgetAlerts = await db
    .select({
      id: projects.id,
      projectId: projects.projectId,
      name: projects.name,
      budgetTotal: sql<number>`
        COALESCE(${projects.opexBudget}, 0) + COALESCE(${projects.capexBudget}, 0)
      `,
      receiptsTotal: sql<number>`
        COALESCE(
          (SELECT SUM(amount) FROM receipts WHERE project_id = ${projects.id}),
          0
        )
      `,
      percentUsed: sql<number>`
        CASE
          WHEN (COALESCE(${projects.opexBudget}, 0) + COALESCE(${projects.capexBudget}, 0)) > 0
          THEN (
            COALESCE(
              (SELECT SUM(amount) FROM receipts WHERE project_id = ${projects.id}),
              0
            ) / (COALESCE(${projects.opexBudget}, 0) + COALESCE(${projects.capexBudget}, 0))
          ) * 100
          ELSE 0
        END
      `,
      type: sql<string>`'budget'`,
      severity: sql<string>`
        CASE
          WHEN (
            COALESCE(
              (SELECT SUM(amount) FROM receipts WHERE project_id = ${projects.id}),
              0
            ) / NULLIF((COALESCE(${projects.opexBudget}, 0) + COALESCE(${projects.capexBudget}, 0)), 0)
          ) > 1.0 THEN 'critical'
          WHEN (
            COALESCE(
              (SELECT SUM(amount) FROM receipts WHERE project_id = ${projects.id}),
              0
            ) / NULLIF((COALESCE(${projects.opexBudget}, 0) + COALESCE(${projects.capexBudget}, 0)), 0)
          ) > 0.95 THEN 'high'
          ELSE 'medium'
        END
      `,
      message: sql<string>`'Budget threshold exceeded'`,
    })
    .from(projects)
    .where(
      and(
        eq(projects.isStopped, false),
        sql`(COALESCE(${projects.opexBudget}, 0) + COALESCE(${projects.capexBudget}, 0)) > 0`,
        sql`
          (
            COALESCE(
              (SELECT SUM(amount) FROM receipts WHERE project_id = ${projects.id}),
              0
            ) / (COALESCE(${projects.opexBudget}, 0) + COALESCE(${projects.capexBudget}, 0))
          ) > 0.90
        `
      )
    );

  return {
    overdue: overdueProjects,
    budget: budgetAlerts,
    totalCount: overdueProjects.length + budgetAlerts.length,
  };
}
```

### Anti-Patterns to Avoid
- **Storing files as BYTEA/BLOB in PostgreSQL:** Database bloat, slow backups, RAM pressure. Use filesystem or object storage instead.
- **Application-level audit logging:** Can be bypassed by direct database access, migrations, or manual SQL. Use database triggers.
- **Heavy state machine libraries for simple workflows:** XState is 10KB+ for a 4-state linear flow. Use discriminated unions.
- **Serving static files from Fastify in production:** Anti-pattern per Fastify team. Use reverse proxy (nginx) or CDN.
- **Wrapping date columns in functions:** Prevents index usage. Use `WHERE end_date < $1` not `WHERE DATE(end_date) < $1`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multipart form parsing | Custom buffer parsing | @fastify/multipart v9.4.0 | Already installed, handles edge cases, streaming |
| File validation | Custom MIME detection | mime-types + allowlist | Reliable, maintained |
| Audit log querying | Manual JSON parsing | PostgreSQL jsonb operators | Indexed, query optimized |
| State machine visualization | Custom diagrams | TypeScript types + documentation | Compile-time checked |
| File serving in production | Fastify static plugin | Nginx/CDN | Horizontal scalability |

**Key insight:** The biggest mistake is building custom solutions for solved problems. This phase has excellent library support—use it.

## Common Pitfalls

### Pitfall 1: Not Setting Application User Context for Triggers
**What goes wrong:** Audit log shows 'system' for all changes instead of actual user email
**Why it happens:** PostgreSQL triggers can't access application session by default
**How to avoid:**
```typescript
// Set user context before each query
await db.execute(sql`SELECT set_config('app.current_user', ${userEmail}, true)`);
// Then perform the update
await db.update(projects).set({ name: 'New Name' }).where(eq(projects.id, 1));
```
**Warning signs:** All audit log entries show changed_by='system'

### Pitfall 2: Race Conditions in Workflow Transitions
**What goes wrong:** Two users approve/reject simultaneously, creating invalid state
**Why it happens:** No optimistic locking on committee workflow
**How to avoid:**
- Add version field to workflow table
- Check version on transition
- Return 409 conflict if version mismatch (same pattern as projects table)
**Warning signs:** Duplicate terminal states (both approved AND rejected)

### Pitfall 3: Unbounded Alert Queries
**What goes wrong:** Alert endpoint times out with 10,000+ projects
**Why it happens:** No pagination, loading all alerts at once
**How to avoid:**
- Add `limit` and `offset` query parameters
- Default to limit=50
- Consider caching alert counts
**Warning signs:** Slow API response times as project count grows

### Pitfall 4: File Upload Without Disk Space Checks
**What goes wrong:** Server runs out of disk space, crashes application
**Why it happens:** No validation of available storage before accepting uploads
**How to avoid:**
- Set reasonable file size limits (10MB per file)
- Monitor disk usage
- Consider object storage (S3) for production
- Implement file cleanup for deleted projects
**Warning signs:** Disk usage creeping toward 100%

### Pitfall 5: Serving Files Without Access Control
**What goes wrong:** Users download business cases from other teams' projects
**Why it happens:** File download endpoint doesn't check project access
**How to avoid:**
```typescript
// Verify user has access to project before serving file
const hasAccess = await checkProjectAccess(userEmail, projectId);
if (!hasAccess) {
  return reply.code(403).send({ error: 'Access denied' });
}
```
**Warning signs:** Security audit finds unauthorized file access

### Pitfall 6: Audit Log Performance Degradation
**What goes wrong:** Audit queries become slow as log grows
**Why it happens:** Missing indexes on high-cardinality columns
**How to avoid:**
- Index project_id (for per-project history)
- Index changed_at DESC (for recent changes)
- Consider partitioning by date for very large tables
**Warning signs:** History sidebar loads slowly

## Code Examples

Verified patterns from official sources:

### Committee Workflow Table Schema
```typescript
// Source: Drizzle ORM schema patterns

export const projectCommitteeWorkflow = pgTable('project_committee_workflow', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer('project_id')
    .notNull()
    .unique() // One workflow per project
    .references(() => projects.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull(), // draft, presented, discussion, approved, rejected
  presentedAt: timestamp('presented_at'),
  presentedBy: varchar('presented_by', { length: 255 }),
  discussionStartedAt: timestamp('discussion_started_at'),
  approvedAt: timestamp('approved_at'),
  approvedBy: varchar('approved_by', { length: 255 }),
  rejectedAt: timestamp('rejected_at'),
  rejectedBy: varchar('rejected_by', { length: 255 }),
  rejectionReason: text('rejection_reason'),
  version: integer('version').notNull().default(1), // Optimistic locking
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectFiles = pgTable('project_files', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 255 }).notNull(), // Original filename
  storedFilename: varchar('stored_filename', { length: 255 }).notNull(), // Timestamped safe filename
  filepath: varchar('filepath', { length: 500 }).notNull(), // Full path on disk
  mimetype: varchar('mimetype', { length: 100 }).notNull(),
  size: integer('size').notNull(), // Bytes
  uploadedBy: varchar('uploaded_by', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Automatic Committee Level Detection
```typescript
// Source: PostgreSQL SQL patterns and Drizzle ORM

// Function to determine committee requirement based on budget
async function getCommitteeRequirement(
  db: Database,
  projectId: number
): Promise<'mandatory' | 'optional' | 'not_necessary'> {

  // Get project budget
  const [project] = await db
    .select({
      opexBudget: projects.opexBudget,
      capexBudget: projects.capexBudget,
      budgetCurrency: projects.budgetCurrency,
    })
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project || !project.budgetCurrency) {
    return 'not_necessary';
  }

  const totalBudget =
    parseFloat(project.opexBudget || '0') +
    parseFloat(project.capexBudget || '0');

  // Get threshold for currency
  const thresholds = await db
    .select()
    .from(committeeThresholds)
    .where(eq(committeeThresholds.currency, project.budgetCurrency))
    .orderBy(committeeThresholds.minAmount);

  // Find matching threshold
  for (const threshold of thresholds) {
    const min = parseFloat(threshold.minAmount);
    const max = threshold.maxAmount ? parseFloat(threshold.maxAmount) : Infinity;

    if (totalBudget >= min && totalBudget < max) {
      return threshold.level as 'mandatory' | 'optional' | 'not_necessary';
    }
  }

  return 'not_necessary';
}
```

### Setting PostgreSQL Session Variables
```typescript
// Source: PostgreSQL session variable best practices

// Middleware to set user context for audit triggers
async function setAuditContext(
  db: Database,
  userEmail: string,
  operation: () => Promise<any>
) {
  try {
    // Set session variable for audit trigger
    await db.execute(
      sql`SELECT set_config('app.current_user', ${userEmail}, true)`
    );

    // Execute the operation
    const result = await operation();

    return result;
  } finally {
    // Clear session variable (optional, 'true' makes it transaction-scoped)
    await db.execute(
      sql`SELECT set_config('app.current_user', '', true)`
    );
  }
}

// Usage in route handler
const result = await setAuditContext(
  fastify.db,
  request.user?.email || 'system',
  async () => {
    return await fastify.db
      .update(projects)
      .set({ name: 'Updated Name', version: currentVersion + 1 })
      .where(eq(projects.id, projectId))
      .returning();
  }
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Storing files in database as BYTEA | Filesystem or object storage (S3) | PostgreSQL 9.x era | Better performance, easier backups |
| Application-level audit logs | Database triggers with JSONB | PostgreSQL 9.4+ (JSONB added) | Tamper-proof, atomic with changes |
| XState for all state machines | Discriminated unions for simple flows | TypeScript 2.0+ (discriminated unions) | Zero dependencies, compile-time safety |
| Plain SQL audit tables | JSONB columns for flexible schema | PostgreSQL 9.4+ | No schema changes when tracking new fields |

**Deprecated/outdated:**
- **pgAudit for application-level auditing**: Overkill for single-table project changes. Use simple trigger function.
- **@fastify/file-upload**: Deprecated, use @fastify/multipart instead (which is already installed)
- **Offset-based pagination for alerts**: Use cursor-based for large datasets (though not needed for MVP)

## Open Questions

Things that couldn't be fully resolved:

1. **File Storage Location for Production**
   - What we know: Local filesystem works for MVP, S3/Azure Blob better for scale
   - What's unclear: Production deployment architecture (single server vs. load balanced)
   - Recommendation: Start with local filesystem, add S3 adapter in future phase if needed

2. **Alert Notification Delivery**
   - What we know: Alert detection queries work, API endpoint provides data
   - What's unclear: Should alerts be push (email/webhook) or pull (frontend polling)?
   - Recommendation: Start with pull (frontend displays in top bar), add push notifications in future if requested

3. **Audit Log Retention Policy**
   - What we know: Triggers capture all changes perpetually
   - What's unclear: Business requirement for retention (keep forever? archive after N years?)
   - Recommendation: No automatic cleanup for MVP, discuss with stakeholders

4. **Committee Step Aggregate Indicator**
   - What we know: Requirement says "committee step appears in portfolio table as aggregate indicator"
   - What's unclear: What does "aggregate" mean across multiple projects?
   - Recommendation: Interpret as "show committee status column for each project in table", clarify during planning

## Sources

### Primary (HIGH confidence)
- [Drizzle ORM Operators Documentation](https://orm.drizzle.team/docs/operators) - Date comparison, filter operators
- [PostgreSQL Audit Trigger Wiki](https://wiki.postgresql.org/wiki/Audit_trigger) - Standard audit trigger patterns
- [@fastify/multipart GitHub](https://github.com/fastify/fastify-multipart) - Official multipart plugin
- [@fastify/multipart npm](https://www.npmjs.com/package/@fastify/multipart) - Version 9.4.0 documentation
- Codebase inspection - Existing patterns for Drizzle schema, migrations, optimistic locking

### Secondary (MEDIUM confidence)
- [TypeScript Exhaustive State Machines (Medium)](https://medium.com/@hjparmar1944/typescript-exhaustive-state-machines-compile-time-guarantees-for-business-workflows-656c04cb6ad1) - Business workflow patterns
- [Composable State Machines in TypeScript (Medium)](https://medium.com/@MichaelVD/composable-state-machines-in-typescript-type-safe-predictable-and-testable-5e16574a6906) - Discriminated union approach
- [File Uploads with Fastify (Better Stack)](https://betterstack.com/community/guides/scaling-nodejs/fastify-file-uploads/) - Best practices
- [PostgreSQL Trigger-Based Audit Log (Medium)](https://medium.com/israeli-tech-radar/postgresql-trigger-based-audit-log-fd9d9d5e412c) - JSONB storage pattern
- [REST API Design: Filtering, Sorting, and Pagination (Moesif)](https://www.moesif.com/blog/technical/api-design/REST-API-Design-Filtering-Sorting-and-Pagination/) - API pagination patterns
- [Row change auditing options for PostgreSQL (CYBERTEC)](https://www.cybertec-postgresql.com/en/row-change-auditing-options-for-postgresql/) - Audit approaches comparison

### Tertiary (LOW confidence)
- [XState vs custom state machines discussion](https://dev.to/davidkpiano/you-don-t-need-a-library-for-state-machines-k7h) - When to use libraries
- [Fastify static files recommendations](https://fastify.dev/docs/latest/Guides/Recommendations/) - Production anti-patterns
- Web search results on alert patterns - Limited backend-specific guidance

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed or native PostgreSQL/TypeScript
- Architecture: HIGH - Patterns verified from official docs and codebase inspection
- Pitfalls: MEDIUM - Based on community best practices and PostgreSQL documentation

**Research date:** 2026-02-06
**Valid until:** 60 days (stable technologies, well-established patterns)
