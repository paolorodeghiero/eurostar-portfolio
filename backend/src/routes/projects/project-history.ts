import type { FastifyInstance } from 'fastify';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { projects, auditLog, statuses, teams, committeeLevels } from '../../db/schema.js';

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

// Reference fields that need resolution from lookup tables
const REFERENCE_FIELDS: Record<string, { table: string; field: string }> = {
  statusId: { table: 'statuses', field: 'name' },
  leadTeamId: { table: 'teams', field: 'name' },
  committeeLevelId: { table: 'committee_levels', field: 'name' },
  previousStatusId: { table: 'statuses', field: 'name' },
};

interface HistoryChange {
  field: string;
  fieldLabel: string;
  oldValue: unknown;
  newValue: unknown;
  resolvedOldValue?: string | null;
  resolvedNewValue?: string | null;
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

    // Collect all reference IDs that need resolution
    const statusIds = new Set<number>();
    const teamIds = new Set<number>();
    const committeeLevelIds = new Set<number>();

    for (const entry of history) {
      if (entry.changes && typeof entry.changes === 'object') {
        const changesObj = entry.changes as Record<string, { old?: unknown; new?: unknown }>;

        for (const [field, change] of Object.entries(changesObj)) {
          if (field === 'statusId' || field === 'previousStatusId') {
            if (typeof change.old === 'number') statusIds.add(change.old);
            if (typeof change.new === 'number') statusIds.add(change.new);
          } else if (field === 'leadTeamId') {
            if (typeof change.old === 'number') teamIds.add(change.old);
            if (typeof change.new === 'number') teamIds.add(change.new);
          } else if (field === 'committeeLevelId') {
            if (typeof change.old === 'number') committeeLevelIds.add(change.old);
            if (typeof change.new === 'number') committeeLevelIds.add(change.new);
          }
        }
      }
    }

    // Batch fetch all referenced entities
    const statusMap = new Map<number, string>();
    if (statusIds.size > 0) {
      const statusRecords = await db
        .select({ id: statuses.id, name: statuses.name })
        .from(statuses)
        .where(inArray(statuses.id, Array.from(statusIds)));
      statusRecords.forEach(s => statusMap.set(s.id, s.name));
    }

    const teamMap = new Map<number, string>();
    if (teamIds.size > 0) {
      const teamRecords = await db
        .select({ id: teams.id, name: teams.name })
        .from(teams)
        .where(inArray(teams.id, Array.from(teamIds)));
      teamRecords.forEach(t => teamMap.set(t.id, t.name));
    }

    const committeeLevelMap = new Map<number, string>();
    if (committeeLevelIds.size > 0) {
      const levelRecords = await db
        .select({ id: committeeLevels.id, name: committeeLevels.name })
        .from(committeeLevels)
        .where(inArray(committeeLevels.id, Array.from(committeeLevelIds)));
      levelRecords.forEach(l => committeeLevelMap.set(l.id, l.name));
    }

    // Helper function to resolve reference values
    const resolveValue = (field: string, value: unknown): string | null => {
      if (typeof value !== 'number') return null;

      if (field === 'statusId' || field === 'previousStatusId') {
        return statusMap.get(value) ?? null;
      } else if (field === 'leadTeamId') {
        return teamMap.get(value) ?? null;
      } else if (field === 'committeeLevelId') {
        return committeeLevelMap.get(value) ?? null;
      }

      return null;
    };

    // Transform for frontend display
    const formatted: HistoryEntry[] = history.map(entry => {
      const changes: HistoryChange[] = [];

      if (entry.changes && typeof entry.changes === 'object') {
        const changesObj = entry.changes as Record<string, { old?: unknown; new?: unknown }>;

        for (const [field, change] of Object.entries(changesObj)) {
          const isReferenceField = field in REFERENCE_FIELDS;

          changes.push({
            field,
            fieldLabel: FIELD_LABELS[field] || field,
            oldValue: change.old ?? null,
            newValue: change.new ?? null,
            resolvedOldValue: isReferenceField ? resolveValue(field, change.old) : undefined,
            resolvedNewValue: isReferenceField ? resolveValue(field, change.new) : undefined,
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
