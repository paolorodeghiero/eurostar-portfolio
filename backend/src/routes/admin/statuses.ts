import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { statuses } from '../../db/schema.js';

export async function statusesRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  fastify.get('/', async () => {
    const list = await db.select().from(statuses).orderBy(statuses.displayOrder);
    return list.map((s) => ({ ...s, usageCount: 0 }));
  });

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const [status] = await db.select().from(statuses).where(eq(statuses.id, id));
    if (!status) return reply.code(404).send({ error: 'Status not found' });
    return { ...status, usageCount: 0, usedBy: [] };
  });

  fastify.post<{
    Body: { name: string; color: string; displayOrder?: number };
  }>('/', async (request, reply) => {
    const { name, color, displayOrder } = request.body;
    if (!name?.trim()) return reply.code(400).send({ error: 'Name is required' });
    if (!color?.match(/^#[0-9A-Fa-f]{6}$/)) {
      return reply.code(400).send({ error: 'Color must be valid hex (e.g., #FF5733)' });
    }

    const [status] = await db
      .insert(statuses)
      .values({ name: name.trim(), color, displayOrder: displayOrder || 0 })
      .returning();
    return reply.code(201).send(status);
  });

  fastify.put<{
    Params: { id: string };
    Body: { name?: string; color?: string; displayOrder?: number };
  }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const { name, color, displayOrder } = request.body;

    const updates: Partial<typeof statuses.$inferInsert> = { updatedAt: new Date() };
    if (name?.trim()) updates.name = name.trim();
    if (color?.match(/^#[0-9A-Fa-f]{6}$/)) updates.color = color;
    if (displayOrder !== undefined) updates.displayOrder = displayOrder;

    const [status] = await db
      .update(statuses)
      .set(updates)
      .where(eq(statuses.id, id))
      .returning();

    if (!status) return reply.code(404).send({ error: 'Status not found' });
    return status;
  });

  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const usageCount = 0; // Placeholder

    if (usageCount > 0) {
      return reply.code(409).send({
        error: 'Cannot delete',
        message: `Status is used by ${usageCount} project(s)`,
        usageCount,
      });
    }

    const [deleted] = await db.delete(statuses).where(eq(statuses.id, id)).returning();
    if (!deleted) return reply.code(404).send({ error: 'Status not found' });
    return { success: true, deleted };
  });
}
