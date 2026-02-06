import type { FastifyInstance } from 'fastify';
import { eq, and, desc, sql } from 'drizzle-orm';
import { projects, auditLog } from '../../db/schema.js';

// Field name mappings for display
const FIELD_LABELS: Record<string, string> = {
  name: 'Project Name',
  statusId: 'Status',
  startDate: 'Start Date',
  endDate: 'End Date',
  leadTeamId: 'Lead Team',
  projectManager: 'Project Manager',
  isOwner: 'IS Owner',
  sponsor: 'Sponsor',
  isStopped: 'Stopped',
  opexBudget: 'OPEX Budget',
  capexBudget: 'CAPEX Budget',
  budgetCurrency: 'Budget Currency',
  committeeState: 'Committee State',
  committeeLevel: 'Committee Level',
  businessCaseFile: 'Business Case File',
  projectId: 'Project ID',
};

interface HistoryChange {
  field: string;
  fieldLabel: string;
  oldValue: unknown;
  newValue: unknown;
}

interface HistoryEntry {
  id: number;
  timestamp: string;
  user: string;
  operation: string;
  changes: HistoryChange[];
}

export async function projectHistoryRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // GET /api/projects/:id/history - Get audit history for a project
  fastify.get<{
    Params: { id: string };
    Querystring: { limit?: string; offset?: string };
  }>('/:id/history', async (request, reply) => {
    const id = parseInt(request.params.id);
    const limit = Math.min(parseInt(request.query.limit || '50'), 100);
    const offset = parseInt(request.query.offset || '0');

    // Verify project exists
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, id));

    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    // Get audit history
    const history = await db
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
          eq(auditLog.recordId, id)
        )
      )
      .orderBy(desc(auditLog.changedAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [countResult] = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(auditLog)
      .where(
        and(
          eq(auditLog.tableName, 'projects'),
          eq(auditLog.recordId, id)
        )
      );

    // Transform for frontend display
    const formatted: HistoryEntry[] = history.map(entry => {
      const changes: HistoryChange[] = [];

      if (entry.changes && typeof entry.changes === 'object') {
        const changesObj = entry.changes as Record<string, { old?: unknown; new?: unknown }>;

        for (const [field, change] of Object.entries(changesObj)) {
          changes.push({
            field,
            fieldLabel: FIELD_LABELS[field] || field,
            oldValue: change.old ?? null,
            newValue: change.new ?? null,
          });
        }
      }

      return {
        id: entry.id,
        timestamp: entry.changedAt.toISOString(),
        user: entry.changedBy,
        operation: entry.operation,
        changes,
      };
    });

    return {
      history: formatted,
      pagination: {
        total: countResult?.count || 0,
        limit,
        offset,
        hasMore: offset + history.length < (countResult?.count || 0),
      },
    };
  });
}
