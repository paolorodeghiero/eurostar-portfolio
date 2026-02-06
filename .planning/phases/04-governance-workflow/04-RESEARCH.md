# Phase 4: Governance & Workflow - Research

**Researched:** 2026-02-06
**Domain:** Workflow state machines, audit trails, file uploads, alert systems
**Confidence:** MEDIUM-HIGH

## Summary

Phase 4 implements committee workflow management, comprehensive audit trails, file uploads, and alert systems. The research reveals that the standard approach combines:

1. **State machines** using TypeScript discriminated unions for simple workflows (Draft→Presented→Discussion→Approved/Rejected), avoiding heavy libraries like XState for this straightforward linear flow
2. **PostgreSQL trigger-based audit trails** capturing all project field changes with who/when/what, storing changes in a dedicated audit table with JSONB for field-level tracking
3. **@fastify/multipart** (already in dependencies) for secure file uploads with stream-based processing and proper path sanitization
4. **Database-driven alerts** using simple queries on project state (overdue dates, budget thresholds) with client-side polling for initial implementation

The key insight is that this phase doesn't require complex external libraries - PostgreSQL triggers, TypeScript discriminated unions, and existing Fastify plugins provide all necessary capabilities with better control and performance.

**Primary recommendation:** Implement workflow as database column with TypeScript validation guards, use PostgreSQL AFTER triggers for audit trail, leverage existing @fastify/multipart for uploads, and build alerts as database views with simple REST endpoints.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL triggers | Built-in | Audit trail capture | Industry standard for database-level change tracking, automatic and reliable |
| TypeScript discriminated unions | Built-in | State machine types | Compile-time safety, no runtime overhead, perfect for simple workflows |
| @fastify/multipart | 9.4.0 | File upload handling | Official Fastify plugin, already in dependencies, stream-based processing |
| Drizzle ORM | 0.38.4 | Database access | Already in use, good JSONB support for audit data |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| path module | Node.js built-in | File path sanitization | Prevent path traversal in uploads |
| crypto.randomUUID | Node.js built-in | Unique filename generation | Collision-resistant file naming |
| zod | 4.3.6 | Runtime validation | Already in stack, validate state transitions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Discriminated unions | XState library | XState adds complexity/bundle size, only needed for hierarchical states or visual debugging |
| PostgreSQL triggers | Application-level tracking | Triggers are automatic and can't be bypassed, application-level is incomplete |
| @fastify/multipart | express-fileupload | Fastify-native plugin better integrated, express-fileupload has known CVE-2022-27261 |
| Database polling | WebSockets/SSE | Polling simpler for low-frequency alerts, upgrade to push later if needed |

**Installation:**
```bash
# No new packages needed - all already installed
# @fastify/multipart already in dependencies at 9.4.0
```

## Architecture Patterns

### Recommended Database Schema Extension
```
backend/src/db/schema.ts additions:

-- Committee workflow state (add to projects table)
committeeState: varchar('committee_state', { length: 20 })
  -- Values: null | 'draft' | 'presented' | 'discussion' | 'approved' | 'rejected'

committeeLevel: varchar('committee_level', { length: 20 })
  -- Values: null | 'mandatory' | 'optional' | 'not_necessary' (auto-derived from budget)

businessCaseFile: varchar('business_case_file', { length: 255 })
  -- Stores filename reference, actual file on disk

-- Audit trail table (new)
export const auditLog = pgTable('audit_log', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: integer('record_id').notNull(), // The projects.id
  changedBy: varchar('changed_by', { length: 255 }).notNull(), // User email
  changedAt: timestamp('changed_at').defaultNow().notNull(),
  operation: varchar('operation', { length: 10 }).notNull(), // INSERT, UPDATE, DELETE
  changes: jsonb('changes'), // { field: { old: val, new: val } }
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

-- Alert configuration (new)
export const alertConfig = pgTable('alert_config', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  type: varchar('type', { length: 50 }).notNull(), // 'overdue' | 'budget_limit'
  enabled: boolean('enabled').notNull().default(true),
  budgetThresholdPercent: integer('budget_threshold_percent'), // e.g., 90 for 90%
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Pattern 1: State Machine with Discriminated Unions
**What:** Use TypeScript string literal unions with validation guards instead of external state machine library
**When to use:** Simple linear workflows without hierarchical states or complex branching
**Example:**
```typescript
// Source: https://bholmes.dev/blog/writing-a-state-machine-in-one-line-with-typescript/

// Define state as string literal union
type CommitteeState = 'draft' | 'presented' | 'discussion' | 'approved' | 'rejected';

// Allowed transitions map
const COMMITTEE_TRANSITIONS: Record<CommitteeState, CommitteeState[]> = {
  draft: ['presented'],
  presented: ['discussion', 'rejected'],
  discussion: ['approved', 'rejected', 'presented'], // Can go back to presented
  approved: [], // Terminal state
  rejected: [], // Terminal state
};

// Validation guard
function canTransition(from: CommitteeState, to: CommitteeState): boolean {
  return COMMITTEE_TRANSITIONS[from].includes(to);
}

// Route handler
fastify.patch<{ Params: { id: string }; Body: { committeeState: CommitteeState } }>(
  '/api/projects/:id/committee-state',
  async (request, reply) => {
    const { committeeState } = request.body;
    const [project] = await db.select().from(projects).where(eq(projects.id, request.params.id));

    // Validate transition
    if (project.committeeState && !canTransition(project.committeeState, committeeState)) {
      return reply.code(400).send({
        error: `Invalid transition from ${project.committeeState} to ${committeeState}`
      });
    }

    // Update with version check (optimistic locking)
    const [updated] = await db.update(projects)
      .set({
        committeeState,
        version: project.version + 1,
        updatedBy: request.user.email,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, project.id), eq(projects.version, project.version)))
      .returning();

    if (!updated) {
      return reply.code(409).send({ error: 'Concurrent modification detected' });
    }

    return updated;
  }
);
```

### Pattern 2: PostgreSQL Trigger-Based Audit Trail
**What:** Use AFTER triggers to automatically log all project changes to audit_log table
**When to use:** Complete, automatic audit trail that can't be bypassed by application code
**Example:**
```sql
-- Source: https://wiki.postgresql.org/wiki/Audit_trigger

-- Audit log function
CREATE OR REPLACE FUNCTION audit_project_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields jsonb := '{}'::jsonb;
  user_email text;
BEGIN
  -- Get user email from application context (set via SET LOCAL)
  user_email := current_setting('app.current_user_email', true);
  IF user_email IS NULL THEN
    user_email := 'system';
  END IF;

  -- Build changes JSON for UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    -- Compare old and new, add to changes if different
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      changed_fields := changed_fields || jsonb_build_object('name',
        jsonb_build_object('old', OLD.name, 'new', NEW.name));
    END IF;
    IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
      changed_fields := changed_fields || jsonb_build_object('status_id',
        jsonb_build_object('old', OLD.status_id, 'new', NEW.status_id));
    END IF;
    IF OLD.committee_state IS DISTINCT FROM NEW.committee_state THEN
      changed_fields := changed_fields || jsonb_build_object('committee_state',
        jsonb_build_object('old', OLD.committee_state, 'new', NEW.committee_state));
    END IF;
    -- Add other fields as needed...

    -- Only log if there were actual changes
    IF changed_fields != '{}'::jsonb THEN
      INSERT INTO audit_log (table_name, record_id, changed_by, operation, changes)
      VALUES ('projects', NEW.id, user_email, 'UPDATE', changed_fields);
    END IF;

  ELSIF TG_OP = 'INSERT' THEN
    -- For INSERT, log all non-null fields as "new"
    changed_fields := jsonb_build_object(
      'name', jsonb_build_object('new', NEW.name),
      'status_id', jsonb_build_object('new', NEW.status_id)
      -- etc...
    );
    INSERT INTO audit_log (table_name, record_id, changed_by, operation, changes)
    VALUES ('projects', NEW.id, user_email, 'INSERT', changed_fields);

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, record_id, changed_by, operation, changes)
    VALUES ('projects', OLD.id, user_email, 'DELETE', NULL);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to projects table
CREATE TRIGGER audit_projects_trigger
AFTER INSERT OR UPDATE OR DELETE ON projects
FOR EACH ROW EXECUTE FUNCTION audit_project_changes();
```

**Application-side context setting:**
```typescript
// Source: https://oneuptime.com/blog/post/2026-01-21-postgresql-audit-logging/view

// Before any project modification
await db.execute(sql`SET LOCAL app.current_user_email = ${request.user.email}`);

// Then perform the update
await db.update(projects).set({ name: 'New Name' }).where(eq(projects.id, 1));

// Trigger automatically logs the change with correct user
```

### Pattern 3: Secure File Upload with Streaming
**What:** Use @fastify/multipart with stream-based processing, unique filenames, and path validation
**When to use:** All file upload scenarios to prevent memory exhaustion and path traversal
**Example:**
```typescript
// Source: https://betterstack.com/community/guides/scaling-nodejs/fastify-file-uploads/
// Source: https://github.com/fastify/fastify-multipart

import { randomUUID } from 'crypto';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import path from 'path';

// Register multipart plugin
await fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1, // Only one file at a time
  },
});

// Upload endpoint
fastify.post<{ Params: { id: string } }>(
  '/api/projects/:id/business-case',
  async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['.pdf', '.docx', '.doc'];
    const ext = path.extname(data.filename).toLowerCase();
    if (!allowedTypes.includes(ext)) {
      return reply.code(400).send({
        error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
      });
    }

    // Generate safe filename (CRITICAL: don't use user-provided filename directly)
    const safeFilename = `${randomUUID()}${ext}`;

    // Define upload directory (absolute path)
    const uploadDir = path.resolve(process.cwd(), 'uploads', 'business-cases');
    const filepath = path.join(uploadDir, safeFilename);

    // SECURITY: Verify resolved path is within upload directory
    if (!filepath.startsWith(uploadDir)) {
      return reply.code(400).send({ error: 'Invalid file path' });
    }

    // Stream file to disk (no memory accumulation)
    await pipeline(data.file, createWriteStream(filepath));

    // Update project record
    const [project] = await db.update(projects)
      .set({
        businessCaseFile: safeFilename,
        updatedBy: request.user.email,
      })
      .where(eq(projects.id, parseInt(request.params.id)))
      .returning();

    return { filename: safeFilename, project };
  }
);
```

### Pattern 4: Database-Driven Alerts with Simple Polling
**What:** Create database views/queries for alert conditions, expose via REST API, client polls periodically
**When to use:** Low to moderate frequency alerts where real-time isn't critical
**Example:**
```typescript
// Source: https://medium.com/towardsdev/push-vs-polling-models-in-real-time-communication-a-comprehensive-guide-15788789b74a

// Alert query helper
async function getActiveAlerts(db: Database) {
  const [config] = await db.select().from(alertConfig);
  const budgetThreshold = config?.budgetThresholdPercent || 90;

  // Overdue projects
  const overdueProjects = await db
    .select({
      id: projects.id,
      projectId: projects.projectId,
      name: projects.name,
      endDate: projects.endDate,
      type: sql<string>`'overdue'`,
      message: sql<string>`'Project is overdue'`,
    })
    .from(projects)
    .where(
      and(
        sql`${projects.endDate} < CURRENT_DATE`,
        sql`${projects.isStopped} = false`,
        // Not already completed/approved
        sql`${projects.statusId} NOT IN (SELECT id FROM statuses WHERE name IN ('Completed', 'Closed'))`
      )
    );

  // Budget approaching limit
  const budgetAlerts = await db.execute(sql`
    SELECT
      p.id,
      p.project_id,
      p.name,
      p.opex_budget + p.capex_budget AS total_budget,
      SUM(r.amount) + SUM(i.amount) AS total_spent,
      'budget_limit' AS type,
      'Project approaching budget limit' AS message
    FROM projects p
    LEFT JOIN receipts r ON r.project_id = p.id
    LEFT JOIN invoices i ON i.project_id = p.id
    WHERE p.opex_budget + p.capex_budget > 0
    GROUP BY p.id, p.project_id, p.name, p.opex_budget, p.capex_budget
    HAVING (SUM(COALESCE(r.amount, 0)) + SUM(COALESCE(i.amount, 0))) / (p.opex_budget + p.capex_budget) >= ${budgetThreshold / 100}
  `);

  return [...overdueProjects, ...budgetAlerts.rows];
}

// REST endpoint
fastify.get('/api/alerts', async (request) => {
  const alerts = await getActiveAlerts(fastify.db);
  return { alerts, count: alerts.length };
});

// Frontend polls every 60 seconds
// setInterval(() => fetch('/api/alerts'), 60000);
```

### Anti-Patterns to Avoid
- **Don't use XState for simple linear workflows:** Adds unnecessary complexity and bundle size when discriminated unions provide type safety with zero runtime overhead
- **Don't track changes in application code only:** Triggers ensure complete audit trail that can't be bypassed by bugs or malicious code
- **Don't use user-provided filenames directly:** Always generate server-controlled filenames to prevent path traversal and overwrites
- **Don't load files into memory:** Use streaming with pipeline() to handle large files without memory exhaustion
- **Don't use WebSockets/SSE prematurely:** Start with polling for alerts, upgrade to push only if frequency/latency becomes an issue

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| State machine validation | Custom if/else chains | Discriminated unions with transition map | Type safety, compile-time checks, exhaustive handling |
| Audit trail | Manual INSERT in every UPDATE | PostgreSQL AFTER triggers | Automatic, can't be bypassed, handles all DML operations |
| File upload streaming | readFile() into memory | @fastify/multipart with pipeline() | Prevents memory exhaustion, handles large files, official plugin |
| Path traversal prevention | String replace for ".." | path.resolve() + startsWith() check | Handles URL encoding, symlinks, other edge cases |
| Unique filenames | Timestamp + random string | crypto.randomUUID() | Cryptographically collision-resistant, no custom logic |
| Change tracking JSONB | Manual JSON.stringify | PostgreSQL jsonb_build_object | Native JSONB support, indexable with GIN, queryable |
| Alert detection | Application timers | Database views + SQL queries | Single source of truth, consistent with data, no sync issues |

**Key insight:** PostgreSQL and Node.js built-ins provide battle-tested solutions. Custom implementations miss edge cases (URL encoding in paths, concurrent updates, trigger ordering) that took years to discover and fix in standard tools.

## Common Pitfalls

### Pitfall 1: Invalid State Transitions Without Guards
**What goes wrong:** Allowing direct state changes without validating allowed transitions leads to inconsistent workflow states (e.g., jumping from 'draft' to 'approved' without review steps)
**Why it happens:** Developers treat state as a simple string field without enforcing business rules
**How to avoid:**
- Define explicit transition map with allowed next states
- Validate transitions in PATCH endpoint before database update
- Use TypeScript discriminated unions for compile-time type safety
- Consider adding database CHECK constraint for additional safety
**Warning signs:** Projects appearing in 'approved' state without audit trail showing intermediate steps

### Pitfall 2: Audit Triggers Missing User Context
**What goes wrong:** Audit log shows 'system' or database user instead of actual application user who made change
**Why it happens:** PostgreSQL triggers execute with database session user, not application user
**How to avoid:**
- Use `SET LOCAL app.current_user_email = $email` before each transaction
- Set in middleware or transaction wrapper for automatic application
- Default to 'system' in trigger if context not set (for migrations, seeds)
- Document requirement in developer guide
**Warning signs:** All audit_log entries showing same user or 'postgres' user

### Pitfall 3: Path Traversal in File Uploads
**What goes wrong:** Attacker uploads file with name like `../../etc/passwd` and writes outside upload directory
**Why it happens:** Using user-provided filename directly in path.join() without validation
**How to avoid:**
- NEVER use user-provided filename for storage
- Generate server-controlled filename with randomUUID()
- Use path.resolve() to get absolute path
- Verify resolved path starts with intended upload directory
- Apply URL decoding before path operations
**Warning signs:** Recent CVE-2026-21440 in @adonisjs/bodyparser shows this is still common in 2026

### Pitfall 4: File Upload Memory Exhaustion
**What goes wrong:** Server crashes or slows when handling large file uploads
**Why it happens:** Using toBuffer() or accumulating file chunks in memory instead of streaming
**How to avoid:**
- Use pipeline() to stream directly to disk/cloud storage
- Never call data.file.toBuffer() for large files
- Set appropriate fileSize limits in @fastify/multipart
- Monitor truncated property to detect limit violations
- Always consume file streams or request will hang
**Warning signs:** Increasing memory usage during uploads, OOM errors on production

### Pitfall 5: Concurrent Update Races Without Optimistic Locking
**What goes wrong:** Two users edit same project simultaneously, second save silently overwrites first user's changes
**Why it happens:** No version checking on UPDATE operations
**How to avoid:**
- Include version column in projects table (already exists)
- Increment version on every update
- WHERE clause must include current version: `WHERE id = ? AND version = ?`
- Return 409 Conflict if no rows updated (version mismatch)
- Frontend must handle 409 by refreshing and prompting user
**Warning signs:** Users reporting "my changes disappeared" or inconsistent field values

### Pitfall 6: JSONB Audit Data Without Indexes
**What goes wrong:** Querying audit history for a project becomes slow as audit_log table grows
**Why it happens:** JSONB columns need specialized indexes (GIN) for efficient querying
**How to avoid:**
- Create GIN index on audit_log.changes: `CREATE INDEX idx_audit_changes ON audit_log USING GIN (changes);`
- Index table_name and record_id for filtering: `CREATE INDEX idx_audit_lookup ON audit_log (table_name, record_id);`
- Partition audit_log table by date for very high volume
- Implement retention policy to archive old audits
**Warning signs:** Slow project sidebar loading, queries timing out on audit_log

### Pitfall 7: Polling Too Frequently for Alerts
**What goes wrong:** Frontend polls /api/alerts every second, creating unnecessary database load
**Why it happens:** Desire for "real-time" alerts without considering actual update frequency
**How to avoid:**
- Start with 60-second polling interval (alerts aren't millisecond-critical)
- Cache alert results for 30 seconds on backend
- Monitor API request rate and database query count
- Only upgrade to WebSockets/SSE if polling proves inadequate
- Consider exponential backoff when no alerts present
**Warning signs:** High CPU on database from alert queries, excessive network requests in browser

## Code Examples

Verified patterns from official sources:

### Committee Level Auto-Determination
```typescript
// Determine committee level based on budget thresholds
async function determineCommitteeLevel(
  totalBudget: number,
  currency: string,
  db: Database
): Promise<'mandatory' | 'optional' | 'not_necessary'> {
  const thresholds = await db
    .select()
    .from(committeeThresholds)
    .where(eq(committeeThresholds.currency, currency))
    .orderBy(committeeThresholds.minAmount);

  for (const threshold of thresholds) {
    const min = parseFloat(threshold.minAmount);
    const max = threshold.maxAmount ? parseFloat(threshold.maxAmount) : Infinity;

    if (totalBudget >= min && totalBudget < max) {
      return threshold.level as 'mandatory' | 'optional' | 'not_necessary';
    }
  }

  return 'not_necessary'; // Default if no threshold matches
}

// Auto-update when budget changes
fastify.patch('/api/projects/:id', async (request, reply) => {
  const { opexBudget, capexBudget, budgetCurrency } = request.body;

  const totalBudget = (opexBudget || 0) + (capexBudget || 0);
  const committeeLevel = await determineCommitteeLevel(
    totalBudget,
    budgetCurrency,
    fastify.db
  );

  await fastify.db.update(projects).set({
    opexBudget,
    capexBudget,
    budgetCurrency,
    committeeLevel, // Auto-set based on budget
    updatedBy: request.user.email,
  }).where(eq(projects.id, request.params.id));

  return { success: true };
});
```

### Audit History Retrieval
```typescript
// Get audit history for a project
fastify.get<{ Params: { id: string } }>(
  '/api/projects/:id/history',
  async (request) => {
    const projectId = parseInt(request.params.id);

    const history = await fastify.db
      .select({
        id: auditLog.id,
        changedBy: auditLog.changedBy,
        changedAt: auditLog.changedAt,
        operation: auditLog.operation,
        changes: auditLog.changes,
      })
      .from(auditLog)
      .where(
        and(
          eq(auditLog.tableName, 'projects'),
          eq(auditLog.recordId, projectId)
        )
      )
      .orderBy(desc(auditLog.changedAt));

    // Transform for frontend display
    const formatted = history.map(entry => ({
      timestamp: entry.changedAt,
      user: entry.changedBy,
      operation: entry.operation,
      fields: entry.changes ? Object.keys(entry.changes) : [],
      changes: entry.changes,
    }));

    return { history: formatted };
  }
);
```

### File Download with Security
```typescript
// Download business case file
fastify.get<{ Params: { id: string } }>(
  '/api/projects/:id/business-case/download',
  async (request, reply) => {
    const projectId = parseInt(request.params.id);

    // Get project and verify file exists
    const [project] = await fastify.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project || !project.businessCaseFile) {
      return reply.code(404).send({ error: 'File not found' });
    }

    // Build safe path
    const uploadDir = path.resolve(process.cwd(), 'uploads', 'business-cases');
    const filepath = path.join(uploadDir, project.businessCaseFile);

    // SECURITY: Verify path is within upload directory
    if (!filepath.startsWith(uploadDir)) {
      return reply.code(403).send({ error: 'Access denied' });
    }

    // Send file with proper content type
    return reply.sendFile(project.businessCaseFile, uploadDir);
  }
);
```

### Setting Audit Context in Middleware
```typescript
// Source: https://oneuptime.com/blog/post/2026-01-21-postgresql-audit-logging/view

// Middleware to set user context for audit triggers
fastify.addHook('onRequest', async (request, reply) => {
  if (request.user?.email) {
    // Set session variable that triggers can access
    await fastify.db.execute(
      sql`SET LOCAL app.current_user_email = ${request.user.email}`
    );
  }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom state validation | Discriminated unions + guards | TypeScript 2.8+ (2018) | Compile-time safety eliminates runtime state bugs |
| Application-level audit | PostgreSQL triggers + JSONB | PostgreSQL 9.4+ (2014) | Complete audit trail, can't be bypassed, queryable history |
| express-fileupload | @fastify/multipart | Fastify ecosystem | Better streaming, security fixes, native integration |
| Boolean flags for state | String literal unions | TypeScript pattern adoption | Prevents impossible state combinations |
| WebSockets for all notifications | Polling first, push later | 2020s best practice | Simpler architecture, upgrade when needed |
| Custom audit JSON | JSONB with GIN indexes | PostgreSQL 9.4+ | Native query support, better performance |
| Temporal tables | Trigger-based audit | Context-dependent | Triggers more flexible for field-level tracking |

**Deprecated/outdated:**
- **XState for simple workflows**: Still excellent library but overkill for linear state machines without complex branching
- **pgAudit for application audits**: Designed for compliance/security auditing, too verbose for user-facing change history
- **Long polling**: Superseded by modern WebSockets/SSE when real-time needed, but regular polling still fine for low-frequency alerts
- **Synchronous file upload processing**: Stream-based async processing is now standard to prevent blocking

## Open Questions

Things that couldn't be fully resolved:

1. **Drizzle ORM trigger management**
   - What we know: Drizzle has no native trigger API, must use raw SQL
   - What's unclear: Best integration pattern with Drizzle migrations
   - Recommendation: Define triggers in separate .sql files, apply via drizzle-kit custom migration or run manually after migration

2. **Alert retention and archiving**
   - What we know: audit_log will grow indefinitely without retention policy
   - What's unclear: Business requirement for how long to keep audit history
   - Recommendation: Start with table partitioning by month, implement archival after determining retention requirements

3. **File storage scalability**
   - What we know: Local filesystem works for moderate volume
   - What's unclear: Expected upload volume and whether cloud storage needed
   - Recommendation: Start with filesystem, plan migration to S3/Azure Blob if volume exceeds 10GB or multi-server deployment needed

4. **Real-time alert requirements**
   - What we know: Polling works for moderate alert frequency
   - What's unclear: Actual user expectation for alert latency
   - Recommendation: Implement with 60-second polling, upgrade to SSE/WebSockets only if users report latency issues

## Sources

### Primary (HIGH confidence)
- [@fastify/multipart GitHub](https://github.com/fastify/fastify-multipart) - File upload streaming patterns
- [PostgreSQL Audit Trigger Wiki](https://wiki.postgresql.org/wiki/Audit_trigger) - Standard audit trigger implementation
- [Better Stack Fastify Guide](https://betterstack.com/community/guides/scaling-nodejs/fastify-file-uploads/) - File upload security patterns
- [Node.js Path Traversal Prevention](https://www.stackhawk.com/blog/node-js-path-traversal-guide-examples-and-prevention/) - Path security best practices
- [OneUptime PostgreSQL Audit Logging](https://oneuptime.com/blog/post/2026-01-21-postgresql-audit-logging/view) - Application context in triggers

### Secondary (MEDIUM confidence)
- [State Machine Pattern TypeScript](https://bholmes.dev/blog/writing-a-state-machine-in-one-line-with-typescript/) - Discriminated union pattern
- [State Machines in TypeScript (Medium)](https://medium.com/@MichaelVD/composable-state-machines-in-typescript-type-safe-predictable-and-testable-5e16574a6906) - Type-safe patterns
- [XState Documentation](https://stately.ai/docs/xstate) - When to use full state machine library
- [Push vs Polling Models](https://medium.com/towardsdev/push-vs-polling-models-in-real-time-communication-a-comprehensive-guide-15788789b74a) - Alert delivery patterns
- [Drizzle Triggers Guide](https://atlasgo.io/guides/orms/drizzle/triggers) - Trigger management with Drizzle
- [Workflow Database Design](https://www.cflowapps.com/approval-workflow-design-patterns/) - Committee workflow patterns
- [PostgreSQL Audit Methods](https://satoricyber.com/postgres-security/postgres-audit/) - Comparison of audit approaches

### Tertiary (LOW confidence - flagged for validation)
- [Recent CVE-2026-21440](https://thehackernews.com/2026/01/critical-adonisjs-bodyparser-flaw-cvss.html) - Path traversal in multipart (validates need for sanitization)
- [Alert Notification System Design](https://www.systemdesignhandbook.com/guides/design-a-notification-system/) - High-level patterns
- [Database-Driven Alerts](https://www.componentsource.com/news/2026/01/23/detect-long-term-patterns-database-alerts) - Pattern detection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in dependencies or PostgreSQL built-ins, well-documented patterns
- Architecture: HIGH - PostgreSQL triggers and Fastify multipart patterns are industry standard with extensive documentation
- State machines: MEDIUM-HIGH - Discriminated union pattern well-established but XState comparison based on community consensus
- Pitfalls: HIGH - Based on official security advisories (CVE-2026-21440) and PostgreSQL documentation
- File uploads: HIGH - Official @fastify/multipart documentation and verified security guides
- Audit trails: HIGH - PostgreSQL wiki and multiple authoritative sources agree on trigger-based approach
- Alerts: MEDIUM - Polling vs push tradeoffs are context-dependent, recommendation is conservative

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (30 days - stable technologies, but security advisories may update)

**Notes:**
- No CONTEXT.md exists - full discretion on approach
- All recommended libraries already in project dependencies
- PostgreSQL trigger approach requires SQL knowledge but provides most reliable audit trail
- File upload security is critical given recent CVE-2026-21440 in similar multipart libraries
- State machine pattern deliberately simple - can upgrade to XState later if workflow becomes more complex
