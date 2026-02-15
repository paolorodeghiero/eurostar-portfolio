import type { FastifyInstance } from 'fastify';
import { eq, count } from 'drizzle-orm';
import { committeeLevels, committeeThresholds } from '../../db/schema.js';

export async function committeeThresholdsRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // List all committee thresholds
  fastify.get('/', async () => {
    const list = await db
      .select({
        id: committeeThresholds.id,
        levelId: committeeThresholds.levelId,
        levelName: committeeLevels.name,
        maxAmount: committeeThresholds.maxAmount,
        createdAt: committeeThresholds.createdAt,
        updatedAt: committeeThresholds.updatedAt,
      })
      .from(committeeThresholds)
      .innerJoin(committeeLevels, eq(committeeThresholds.levelId, committeeLevels.id));
    return list.map((t) => ({ ...t, usageCount: 0 }));
  });

  // Get single committee threshold
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const [threshold] = await db
      .select({
        id: committeeThresholds.id,
        levelId: committeeThresholds.levelId,
        levelName: committeeLevels.name,
        maxAmount: committeeThresholds.maxAmount,
        createdAt: committeeThresholds.createdAt,
        updatedAt: committeeThresholds.updatedAt,
      })
      .from(committeeThresholds)
      .innerJoin(committeeLevels, eq(committeeThresholds.levelId, committeeLevels.id))
      .where(eq(committeeThresholds.id, id));
    if (!threshold) return reply.code(404).send({ error: 'Committee threshold not found' });
    return { ...threshold, usageCount: 0, usedBy: [] };
  });

  // Create committee threshold
  fastify.post<{
    Body: {
      levelId: number;
      maxAmount?: string;
    };
  }>('/', async (request, reply) => {
    const { levelId, maxAmount } = request.body;

    // Validate levelId exists
    const [level] = await db.select().from(committeeLevels).where(eq(committeeLevels.id, levelId));
    if (!level) {
      return reply.code(400).send({ error: 'Invalid levelId: committee level not found' });
    }

    // Validate maxAmount if provided
    if (maxAmount !== undefined && maxAmount !== null && maxAmount !== '') {
      const maxNum = parseFloat(maxAmount);
      if (isNaN(maxNum) || maxNum < 0) {
        return reply.code(400).send({ error: 'maxAmount must be a non-negative number' });
      }
    }

    const [threshold] = await db
      .insert(committeeThresholds)
      .values({
        levelId,
        maxAmount: maxAmount || null,
      })
      .returning();

    // Return with levelName for display
    return reply.code(201).send({ ...threshold, levelName: level.name });
  });

  // Update committee threshold
  fastify.put<{
    Params: { id: string };
    Body: {
      levelId?: number;
      maxAmount?: string;
    };
  }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const { levelId, maxAmount } = request.body;

    const updates: Partial<typeof committeeThresholds.$inferInsert> = { updatedAt: new Date() };

    if (levelId !== undefined) {
      // Validate levelId exists
      const [level] = await db.select().from(committeeLevels).where(eq(committeeLevels.id, levelId));
      if (!level) {
        return reply.code(400).send({ error: 'Invalid levelId: committee level not found' });
      }
      updates.levelId = levelId;
    }
    if (maxAmount !== undefined) {
      if (maxAmount && maxAmount !== '') {
        const maxNum = parseFloat(maxAmount);
        if (isNaN(maxNum) || maxNum < 0) {
          return reply.code(400).send({ error: 'maxAmount must be a non-negative number' });
        }
      }
      updates.maxAmount = maxAmount || null;
    }

    const [threshold] = await db
      .update(committeeThresholds)
      .set(updates)
      .where(eq(committeeThresholds.id, id))
      .returning();

    if (!threshold) return reply.code(404).send({ error: 'Committee threshold not found' });

    // Get level name for response
    const [level] = await db.select().from(committeeLevels).where(eq(committeeLevels.id, threshold.levelId));
    return { ...threshold, levelName: level?.name };
  });

  // Delete committee threshold
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);

    const [deleted] = await db.delete(committeeThresholds).where(eq(committeeThresholds.id, id)).returning();
    if (!deleted) return reply.code(404).send({ error: 'Committee threshold not found' });
    return { success: true, deleted };
  });
}
