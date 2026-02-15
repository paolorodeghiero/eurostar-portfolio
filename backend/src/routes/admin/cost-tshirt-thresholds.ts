import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { costTshirtThresholds } from '../../db/schema.js';

const VALID_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

export async function costTshirtThresholdsRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // List all cost t-shirt thresholds
  fastify.get('/', async () => {
    return db.select().from(costTshirtThresholds);
  });

  // Get single cost t-shirt threshold
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const [threshold] = await db.select().from(costTshirtThresholds).where(eq(costTshirtThresholds.id, id));
    if (!threshold) return reply.code(404).send({ error: 'Cost t-shirt threshold not found' });
    return threshold;
  });

  // Create cost t-shirt threshold
  fastify.post<{
    Body: {
      size: string;
      maxAmount: string;
      currency: string;
    };
  }>('/', async (request, reply) => {
    const { size, maxAmount, currency } = request.body;

    // Validate size
    if (!VALID_SIZES.includes(size as (typeof VALID_SIZES)[number])) {
      return reply.code(400).send({ error: `size must be one of: ${VALID_SIZES.join(', ')}` });
    }

    // Validate maxAmount
    const maxNum = parseFloat(maxAmount);
    if (isNaN(maxNum) || maxNum < 0) {
      return reply.code(400).send({ error: 'maxAmount must be a non-negative number' });
    }

    // Validate currency
    if (!currency?.match(/^[A-Z]{3}$/)) {
      return reply.code(400).send({ error: 'currency must be 3 uppercase letters (e.g., EUR)' });
    }

    const [threshold] = await db
      .insert(costTshirtThresholds)
      .values({
        size,
        maxAmount,
        currency,
      })
      .returning();
    return reply.code(201).send(threshold);
  });

  // Update cost t-shirt threshold
  fastify.put<{
    Params: { id: string };
    Body: {
      size?: string;
      maxAmount?: string;
      currency?: string;
    };
  }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const { size, maxAmount, currency } = request.body;

    const updates: Partial<typeof costTshirtThresholds.$inferInsert> = { updatedAt: new Date() };

    if (size !== undefined) {
      if (!VALID_SIZES.includes(size as (typeof VALID_SIZES)[number])) {
        return reply.code(400).send({ error: `size must be one of: ${VALID_SIZES.join(', ')}` });
      }
      updates.size = size;
    }
    if (maxAmount !== undefined) {
      const maxNum = parseFloat(maxAmount);
      if (isNaN(maxNum) || maxNum < 0) {
        return reply.code(400).send({ error: 'maxAmount must be a non-negative number' });
      }
      updates.maxAmount = maxAmount;
    }
    if (currency !== undefined) {
      if (!currency?.match(/^[A-Z]{3}$/)) {
        return reply.code(400).send({ error: 'currency must be 3 uppercase letters (e.g., EUR)' });
      }
      updates.currency = currency;
    }

    const [threshold] = await db
      .update(costTshirtThresholds)
      .set(updates)
      .where(eq(costTshirtThresholds.id, id))
      .returning();

    if (!threshold) return reply.code(404).send({ error: 'Cost t-shirt threshold not found' });
    return threshold;
  });

  // Delete cost t-shirt threshold
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);

    const [deleted] = await db.delete(costTshirtThresholds).where(eq(costTshirtThresholds.id, id)).returning();
    if (!deleted) return reply.code(404).send({ error: 'Cost t-shirt threshold not found' });
    return { success: true, deleted };
  });
}
