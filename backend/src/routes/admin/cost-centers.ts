import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { costCenters } from '../../db/schema.js';

export async function costCentersRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // List all cost centers with usage count
  fastify.get('/', async () => {
    const list = await db.select().from(costCenters);
    return list.map((c) => ({ ...c, usageCount: 0 })); // Placeholder until projects exist
  });

  // Get single cost center
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const [costCenter] = await db.select().from(costCenters).where(eq(costCenters.id, id));
    if (!costCenter) return reply.code(404).send({ error: 'Cost center not found' });
    return { ...costCenter, usageCount: 0, usedBy: [] };
  });

  // Create cost center
  fastify.post<{
    Body: { code: string; description?: string };
  }>('/', async (request, reply) => {
    const { code, description } = request.body;
    if (!code?.trim()) return reply.code(400).send({ error: 'Code is required' });

    // Check for unique code
    const [existing] = await db.select().from(costCenters).where(eq(costCenters.code, code.trim()));
    if (existing) {
      return reply.code(400).send({ error: 'Cost center code already exists' });
    }

    const [costCenter] = await db
      .insert(costCenters)
      .values({
        code: code.trim(),
        description: description?.trim() || null,
      })
      .returning();
    return reply.code(201).send(costCenter);
  });

  // Update cost center
  fastify.put<{
    Params: { id: string };
    Body: { code?: string; description?: string };
  }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const { code, description } = request.body;

    const updates: Partial<typeof costCenters.$inferInsert> = { updatedAt: new Date() };
    if (code?.trim()) {
      // Check for unique code (excluding current record)
      const [existing] = await db.select().from(costCenters).where(eq(costCenters.code, code.trim()));
      if (existing && existing.id !== id) {
        return reply.code(400).send({ error: 'Cost center code already exists' });
      }
      updates.code = code.trim();
    }
    if (description !== undefined) updates.description = description?.trim() || null;

    const [costCenter] = await db
      .update(costCenters)
      .set(updates)
      .where(eq(costCenters.id, id))
      .returning();

    if (!costCenter) return reply.code(404).send({ error: 'Cost center not found' });
    return costCenter;
  });

  // Delete cost center (blocked if in use)
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const usageCount = 0; // Placeholder until projects exist

    if (usageCount > 0) {
      return reply.code(409).send({
        error: 'Cannot delete',
        message: `Cost center is used by ${usageCount} project(s)`,
        usageCount,
      });
    }

    const [deleted] = await db.delete(costCenters).where(eq(costCenters.id, id)).returning();
    if (!deleted) return reply.code(404).send({ error: 'Cost center not found' });
    return { success: true, deleted };
  });
}
