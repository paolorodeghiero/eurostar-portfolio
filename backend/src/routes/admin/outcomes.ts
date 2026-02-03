import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { outcomes } from '../../db/schema.js';

export async function outcomesRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // List all outcomes with usage count
  fastify.get('/', async () => {
    const list = await db.select().from(outcomes);
    return list.map((o) => ({ ...o, usageCount: 0 })); // Placeholder until projects exist
  });

  // Get single outcome
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const [outcome] = await db.select().from(outcomes).where(eq(outcomes.id, id));
    if (!outcome) return reply.code(404).send({ error: 'Outcome not found' });
    return { ...outcome, usageCount: 0, usedBy: [] };
  });

  // Create outcome
  fastify.post<{
    Body: {
      name: string;
      score1Example?: string;
      score2Example?: string;
      score3Example?: string;
      score4Example?: string;
      score5Example?: string;
    };
  }>('/', async (request, reply) => {
    const { name, score1Example, score2Example, score3Example, score4Example, score5Example } = request.body;
    if (!name?.trim()) return reply.code(400).send({ error: 'Name is required' });

    const [outcome] = await db
      .insert(outcomes)
      .values({
        name: name.trim(),
        score1Example: score1Example?.trim() || null,
        score2Example: score2Example?.trim() || null,
        score3Example: score3Example?.trim() || null,
        score4Example: score4Example?.trim() || null,
        score5Example: score5Example?.trim() || null,
      })
      .returning();
    return reply.code(201).send(outcome);
  });

  // Update outcome
  fastify.put<{
    Params: { id: string };
    Body: {
      name?: string;
      score1Example?: string;
      score2Example?: string;
      score3Example?: string;
      score4Example?: string;
      score5Example?: string;
    };
  }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const { name, score1Example, score2Example, score3Example, score4Example, score5Example } = request.body;

    const updates: Partial<typeof outcomes.$inferInsert> = { updatedAt: new Date() };
    if (name?.trim()) updates.name = name.trim();
    if (score1Example !== undefined) updates.score1Example = score1Example?.trim() || null;
    if (score2Example !== undefined) updates.score2Example = score2Example?.trim() || null;
    if (score3Example !== undefined) updates.score3Example = score3Example?.trim() || null;
    if (score4Example !== undefined) updates.score4Example = score4Example?.trim() || null;
    if (score5Example !== undefined) updates.score5Example = score5Example?.trim() || null;

    const [outcome] = await db
      .update(outcomes)
      .set(updates)
      .where(eq(outcomes.id, id))
      .returning();

    if (!outcome) return reply.code(404).send({ error: 'Outcome not found' });
    return outcome;
  });

  // Delete outcome (blocked if in use)
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const usageCount = 0; // Placeholder until projects exist

    if (usageCount > 0) {
      return reply.code(409).send({
        error: 'Cannot delete',
        message: `Outcome is used by ${usageCount} project(s)`,
        usageCount,
      });
    }

    const [deleted] = await db.delete(outcomes).where(eq(outcomes.id, id)).returning();
    if (!deleted) return reply.code(404).send({ error: 'Outcome not found' });
    return { success: true, deleted };
  });
}
