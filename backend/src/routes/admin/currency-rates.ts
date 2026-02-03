import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { currencyRates } from '../../db/schema.js';

export async function currencyRatesRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // List all currency rates
  fastify.get('/', async () => {
    const list = await db.select().from(currencyRates);
    return list.map((r) => ({ ...r, usageCount: 0 }));
  });

  // Get single currency rate
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const [rate] = await db.select().from(currencyRates).where(eq(currencyRates.id, id));
    if (!rate) return reply.code(404).send({ error: 'Currency rate not found' });
    return { ...rate, usageCount: 0, usedBy: [] };
  });

  // Create currency rate
  fastify.post<{
    Body: {
      fromCurrency: string;
      toCurrency: string;
      rate: string;
      validFrom: string;
      validTo?: string;
    };
  }>('/', async (request, reply) => {
    const { fromCurrency, toCurrency, rate, validFrom, validTo } = request.body;

    // Validate currencies
    if (!fromCurrency?.match(/^[A-Z]{3}$/)) {
      return reply.code(400).send({ error: 'fromCurrency must be 3 uppercase letters (e.g., EUR)' });
    }
    if (!toCurrency?.match(/^[A-Z]{3}$/)) {
      return reply.code(400).send({ error: 'toCurrency must be 3 uppercase letters (e.g., GBP)' });
    }

    // Validate rate
    const rateNum = parseFloat(rate);
    if (isNaN(rateNum) || rateNum <= 0) {
      return reply.code(400).send({ error: 'Rate must be a positive number' });
    }

    // Validate dates
    if (!validFrom) {
      return reply.code(400).send({ error: 'validFrom date is required' });
    }

    const [currencyRate] = await db
      .insert(currencyRates)
      .values({
        fromCurrency,
        toCurrency,
        rate: rate,
        validFrom: validFrom,
        validTo: validTo || null,
      })
      .returning();
    return reply.code(201).send(currencyRate);
  });

  // Update currency rate
  fastify.put<{
    Params: { id: string };
    Body: {
      fromCurrency?: string;
      toCurrency?: string;
      rate?: string;
      validFrom?: string;
      validTo?: string;
    };
  }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const { fromCurrency, toCurrency, rate, validFrom, validTo } = request.body;

    const updates: Partial<typeof currencyRates.$inferInsert> = { updatedAt: new Date() };

    if (fromCurrency !== undefined) {
      if (!fromCurrency?.match(/^[A-Z]{3}$/)) {
        return reply.code(400).send({ error: 'fromCurrency must be 3 uppercase letters (e.g., EUR)' });
      }
      updates.fromCurrency = fromCurrency;
    }
    if (toCurrency !== undefined) {
      if (!toCurrency?.match(/^[A-Z]{3}$/)) {
        return reply.code(400).send({ error: 'toCurrency must be 3 uppercase letters (e.g., GBP)' });
      }
      updates.toCurrency = toCurrency;
    }
    if (rate !== undefined) {
      const rateNum = parseFloat(rate);
      if (isNaN(rateNum) || rateNum <= 0) {
        return reply.code(400).send({ error: 'Rate must be a positive number' });
      }
      updates.rate = rate;
    }
    if (validFrom !== undefined) updates.validFrom = validFrom;
    if (validTo !== undefined) updates.validTo = validTo || null;

    const [currencyRate] = await db
      .update(currencyRates)
      .set(updates)
      .where(eq(currencyRates.id, id))
      .returning();

    if (!currencyRate) return reply.code(404).send({ error: 'Currency rate not found' });
    return currencyRate;
  });

  // Delete currency rate
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);

    const [deleted] = await db.delete(currencyRates).where(eq(currencyRates.id, id)).returning();
    if (!deleted) return reply.code(404).send({ error: 'Currency rate not found' });
    return { success: true, deleted };
  });
}
