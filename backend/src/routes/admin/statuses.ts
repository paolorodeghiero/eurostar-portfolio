import type { FastifyInstance } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import { statuses, projects } from '../../db/schema.js';

export async function statusesRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  fastify.get('/', async () => {
    const list = await db.select().from(statuses).orderBy(statuses.displayOrder);

    // Get usage counts for each status
    const statusesWithUsage = await Promise.all(
      list.map(async (s) => {
        const [result] = await db
          .select({ count: sql<string>`count(*)` })
          .from(projects)
          .where(eq(projects.statusId, s.id));
        const usageCount = Number(result?.count) || 0;
        return {
          ...s,
          usageCount,
          isSystemStatus: s.isSystemStatus,
          isReadOnly: s.isReadOnly,
        };
      })
    );
    return statusesWithUsage;
  });

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const [status] = await db.select().from(statuses).where(eq(statuses.id, id));
    if (!status) return reply.code(404).send({ error: 'Status not found' });

    // Count projects using this status
    const [result] = await db
      .select({ count: sql<string>`count(*)` })
      .from(projects)
      .where(eq(projects.statusId, id));
    const usageCount = Number(result?.count) || 0;

    return {
      ...status,
      usageCount,
      usedBy: [],
      isSystemStatus: status.isSystemStatus,
      isReadOnly: status.isReadOnly,
    };
  });

  fastify.post<{
    Body: { name: string; color: string; displayOrder?: number };
  }>('/', async (request, reply) => {
    const { name, color, displayOrder } = request.body;
    if (!name?.trim()) return reply.code(400).send({ error: 'Name is required' });
    if (!color?.match(/^#[0-9A-Fa-f]{6}$/)) {
      return reply.code(400).send({ error: 'Color must be valid hex (e.g., #FF5733)' });
    }

    // isSystemStatus is server-controlled, always false for new statuses created via API
    const [status] = await db
      .insert(statuses)
      .values({
        name: name.trim(),
        color,
        displayOrder: displayOrder || 0,
        isSystemStatus: false,
        isReadOnly: false,
      })
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
    // Note: isSystemStatus and isReadOnly are server-controlled and cannot be changed via API

    const [status] = await db
      .update(statuses)
      .set(updates)
      .where(eq(statuses.id, id))
      .returning();

    if (!status) return reply.code(404).send({ error: 'Status not found' });
    return status;
  });

  // Get status usage details
  fastify.get<{ Params: { id: string } }>('/:id/usage', async (request, reply) => {
    const id = parseInt(request.params.id);

    // Check if status exists
    const [status] = await db.select().from(statuses).where(eq(statuses.id, id));
    if (!status) {
      return reply.code(404).send({ error: 'Status not found' });
    }

    // Find projects with this status
    const projectsList = await db
      .select({
        id: projects.id,
        projectId: projects.projectId,
        name: projects.name,
      })
      .from(projects)
      .where(eq(projects.statusId, id));

    return { projects: projectsList };
  });

  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);

    // Check if it's a system status
    const [status] = await db.select().from(statuses).where(eq(statuses.id, id));
    if (!status) return reply.code(404).send({ error: 'Status not found' });

    if (status.isSystemStatus) {
      return reply.code(400).send({
        error: 'Cannot delete system status',
        message: 'System statuses (Draft, Stopped, Completed) cannot be deleted',
      });
    }

    // Count projects using this status
    const [result] = await db
      .select({ count: sql<string>`count(*)` })
      .from(projects)
      .where(eq(projects.statusId, id));
    const usageCount = Number(result?.count) || 0;

    if (usageCount > 0) {
      return reply.code(409).send({
        error: 'Cannot delete',
        message: `Status is used by ${usageCount} project(s)`,
        usageCount,
      });
    }

    const [deleted] = await db.delete(statuses).where(eq(statuses.id, id)).returning();
    return { success: true, deleted };
  });
}
