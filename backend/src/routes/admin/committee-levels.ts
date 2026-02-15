import type { FastifyInstance } from 'fastify';
import { eq, count } from 'drizzle-orm';
import { committeeLevels, committeeThresholds } from '../../db/schema.js';

export async function committeeLevelsRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // List all committee levels (ordered by displayOrder)
  fastify.get('/', async () => {
    const list = await db
      .select()
      .from(committeeLevels)
      .orderBy(committeeLevels.displayOrder);

    // Calculate usage count for each level
    const listWithUsage = await Promise.all(
      list.map(async (level) => {
        const [usageResult] = await db
          .select({ count: count() })
          .from(committeeThresholds)
          .where(eq(committeeThresholds.levelId, level.id));
        return { ...level, usageCount: usageResult?.count || 0 };
      })
    );

    return listWithUsage;
  });

  // Get single committee level with usage count
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const [level] = await db.select().from(committeeLevels).where(eq(committeeLevels.id, id));
    if (!level) return reply.code(404).send({ error: 'Committee level not found' });

    // Get usage count (thresholds using this level)
    const [usageResult] = await db
      .select({ count: count() })
      .from(committeeThresholds)
      .where(eq(committeeThresholds.levelId, id));

    // Get projects using this level (via thresholds)
    const thresholds = await db
      .select()
      .from(committeeThresholds)
      .where(eq(committeeThresholds.levelId, id));

    return {
      ...level,
      usageCount: usageResult?.count || 0,
      usedBy: thresholds.map(t => ({ type: 'threshold', id: t.id }))
    };
  });

  // Create committee level
  fastify.post<{
    Body: {
      name: string;
      mandatory: boolean;
      displayOrder: number;
    };
  }>('/', async (request, reply) => {
    const { name, mandatory, displayOrder } = request.body;

    // Validate name is provided
    if (!name || name.trim() === '') {
      return reply.code(400).send({ error: 'name is required' });
    }

    // Validate displayOrder
    if (displayOrder === undefined || displayOrder === null || isNaN(displayOrder) || displayOrder < 1) {
      return reply.code(400).send({ error: 'displayOrder must be a positive integer' });
    }

    // Validate mandatory is boolean
    if (mandatory === undefined || mandatory === null || typeof mandatory !== 'boolean') {
      return reply.code(400).send({ error: 'mandatory must be a boolean' });
    }

    const [level] = await db
      .insert(committeeLevels)
      .values({
        name: name.trim(),
        mandatory,
        displayOrder,
      })
      .returning();
    return reply.code(201).send(level);
  });

  // Update committee level
  fastify.put<{
    Params: { id: string };
    Body: {
      name?: string;
      mandatory?: boolean;
      displayOrder?: number;
    };
  }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const { name, mandatory, displayOrder } = request.body;

    const updates: Partial<typeof committeeLevels.$inferInsert> = { updatedAt: new Date() };

    if (name !== undefined) {
      if (!name || name.trim() === '') {
        return reply.code(400).send({ error: 'name cannot be empty' });
      }
      updates.name = name.trim();
    }
    if (mandatory !== undefined) {
      if (typeof mandatory !== 'boolean') {
        return reply.code(400).send({ error: 'mandatory must be a boolean' });
      }
      updates.mandatory = mandatory;
    }
    if (displayOrder !== undefined) {
      if (isNaN(displayOrder) || displayOrder < 1) {
        return reply.code(400).send({ error: 'displayOrder must be a positive integer' });
      }
      updates.displayOrder = displayOrder;
    }

    const [level] = await db
      .update(committeeLevels)
      .set(updates)
      .where(eq(committeeLevels.id, id))
      .returning();

    if (!level) return reply.code(404).send({ error: 'Committee level not found' });
    return level;
  });

  // Delete committee level
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);

    // Check if level is used by any thresholds
    const [usageResult] = await db
      .select({ count: count() })
      .from(committeeThresholds)
      .where(eq(committeeThresholds.levelId, id));

    if (usageResult && usageResult.count > 0) {
      return reply.code(409).send({
        error: 'Cannot delete committee level',
        reason: `This level is used by ${usageResult.count} committee threshold(s)`,
        usageCount: usageResult.count,
      });
    }

    const [deleted] = await db.delete(committeeLevels).where(eq(committeeLevels.id, id)).returning();
    if (!deleted) return reply.code(404).send({ error: 'Committee level not found' });
    return { success: true, deleted };
  });
}
