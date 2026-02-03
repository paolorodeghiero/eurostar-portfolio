import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { committeeThresholds } from '../../db/schema.js';

const VALID_LEVELS = ['mandatory', 'optional', 'not_necessary'] as const;

export async function committeeThresholdsRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // List all committee thresholds
  fastify.get('/', async () => {
    const list = await db.select().from(committeeThresholds);
    return list.map((t) => ({ ...t, usageCount: 0 }));
  });

  // Get single committee threshold
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const [threshold] = await db.select().from(committeeThresholds).where(eq(committeeThresholds.id, id));
    if (!threshold) return reply.code(404).send({ error: 'Committee threshold not found' });
    return { ...threshold, usageCount: 0, usedBy: [] };
  });

  // Create committee threshold
  fastify.post<{
    Body: {
      minAmount: string;
      maxAmount?: string;
      level: string;
      currency: string;
    };
  }>('/', async (request, reply) => {
    const { minAmount, maxAmount, level, currency } = request.body;

    // Validate minAmount
    const minNum = parseFloat(minAmount);
    if (isNaN(minNum) || minNum < 0) {
      return reply.code(400).send({ error: 'minAmount must be a non-negative number' });
    }

    // Validate maxAmount if provided
    if (maxAmount !== undefined) {
      const maxNum = parseFloat(maxAmount);
      if (isNaN(maxNum) || maxNum < 0) {
        return reply.code(400).send({ error: 'maxAmount must be a non-negative number' });
      }
      if (maxNum <= minNum) {
        return reply.code(400).send({ error: 'maxAmount must be greater than minAmount' });
      }
    }

    // Validate level
    if (!VALID_LEVELS.includes(level as (typeof VALID_LEVELS)[number])) {
      return reply.code(400).send({ error: `level must be one of: ${VALID_LEVELS.join(', ')}` });
    }

    // Validate currency
    if (!currency?.match(/^[A-Z]{3}$/)) {
      return reply.code(400).send({ error: 'currency must be 3 uppercase letters (e.g., EUR)' });
    }

    const [threshold] = await db
      .insert(committeeThresholds)
      .values({
        minAmount,
        maxAmount: maxAmount || null,
        level,
        currency,
      })
      .returning();
    return reply.code(201).send(threshold);
  });

  // Update committee threshold
  fastify.put<{
    Params: { id: string };
    Body: {
      minAmount?: string;
      maxAmount?: string;
      level?: string;
      currency?: string;
    };
  }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const { minAmount, maxAmount, level, currency } = request.body;

    const updates: Partial<typeof committeeThresholds.$inferInsert> = { updatedAt: new Date() };

    if (minAmount !== undefined) {
      const minNum = parseFloat(minAmount);
      if (isNaN(minNum) || minNum < 0) {
        return reply.code(400).send({ error: 'minAmount must be a non-negative number' });
      }
      updates.minAmount = minAmount;
    }
    if (maxAmount !== undefined) {
      if (maxAmount) {
        const maxNum = parseFloat(maxAmount);
        if (isNaN(maxNum) || maxNum < 0) {
          return reply.code(400).send({ error: 'maxAmount must be a non-negative number' });
        }
      }
      updates.maxAmount = maxAmount || null;
    }
    if (level !== undefined) {
      if (!VALID_LEVELS.includes(level as (typeof VALID_LEVELS)[number])) {
        return reply.code(400).send({ error: `level must be one of: ${VALID_LEVELS.join(', ')}` });
      }
      updates.level = level;
    }
    if (currency !== undefined) {
      if (!currency?.match(/^[A-Z]{3}$/)) {
        return reply.code(400).send({ error: 'currency must be 3 uppercase letters (e.g., EUR)' });
      }
      updates.currency = currency;
    }

    const [threshold] = await db
      .update(committeeThresholds)
      .set(updates)
      .where(eq(committeeThresholds.id, id))
      .returning();

    if (!threshold) return reply.code(404).send({ error: 'Committee threshold not found' });
    return threshold;
  });

  // Delete committee threshold
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);

    const [deleted] = await db.delete(committeeThresholds).where(eq(committeeThresholds.id, id)).returning();
    if (!deleted) return reply.code(404).send({ error: 'Committee threshold not found' });
    return { success: true, deleted };
  });
}
