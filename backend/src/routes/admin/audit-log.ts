import type { FastifyInstance } from 'fastify';
import { and, gte, lte, like, eq, count, desc } from 'drizzle-orm';
import { auditLog } from '../../db/schema.js';

export async function auditLogRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // Get system-wide audit log with filtering
  fastify.get<{
    Querystring: {
      startDate?: string;
      endDate?: string;
      tableName?: string;
      changedBy?: string;
      operation?: string;
      limit?: string;
      offset?: string;
    };
  }>('/', async (request, reply) => {
    const {
      startDate,
      endDate,
      tableName,
      changedBy,
      operation,
      limit = '50',
      offset = '0',
    } = request.query;

    // Build conditions array
    const conditions = [];

    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return reply.code(400).send({ error: 'Invalid startDate format' });
      }
      conditions.push(gte(auditLog.changedAt, start));
    }

    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return reply.code(400).send({ error: 'Invalid endDate format' });
      }
      conditions.push(lte(auditLog.changedAt, end));
    }

    if (tableName) {
      conditions.push(eq(auditLog.tableName, tableName));
    }

    if (changedBy) {
      conditions.push(like(auditLog.changedBy, `%${changedBy}%`));
    }

    if (operation) {
      conditions.push(eq(auditLog.operation, operation));
    }

    // Parse and validate limit (max 200)
    const parsedLimit = Math.min(parseInt(limit) || 50, 200);
    const parsedOffset = parseInt(offset) || 0;

    // Get total count for pagination
    const [totalResult] = await db
      .select({ count: count() })
      .from(auditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get entries with filters
    const entries = await db
      .select()
      .from(auditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLog.changedAt))
      .limit(parsedLimit)
      .offset(parsedOffset);

    return {
      entries: entries.map((entry) => ({
        id: entry.id,
        tableName: entry.tableName,
        recordId: entry.recordId,
        changedBy: entry.changedBy,
        changedAt: entry.changedAt.toISOString(),
        operation: entry.operation,
        changes: entry.changes,
      })),
      total: totalResult.count,
    };
  });
}
