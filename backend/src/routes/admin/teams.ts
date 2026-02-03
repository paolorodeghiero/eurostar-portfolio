import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { teams, departments } from '../../db/schema.js';

export async function teamsRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // List all teams with usage count
  fastify.get('/', async () => {
    const teamsList = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        departmentId: teams.departmentId,
        departmentName: departments.name,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
      })
      .from(teams)
      .leftJoin(departments, eq(teams.departmentId, departments.id));

    // Usage count placeholder (will be projects count in Phase 2)
    return teamsList.map((team) => ({ ...team, usageCount: 0 }));
  });

  // Get single team
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const [team] = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        departmentId: teams.departmentId,
        departmentName: departments.name,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
      })
      .from(teams)
      .leftJoin(departments, eq(teams.departmentId, departments.id))
      .where(eq(teams.id, id));

    if (!team) {
      return reply.code(404).send({ error: 'Team not found' });
    }

    return { ...team, usageCount: 0, usedBy: [] };
  });

  // Create team
  fastify.post<{
    Body: { name: string; description?: string; departmentId: number };
  }>('/', async (request, reply) => {
    const { name, description, departmentId } = request.body;

    if (!name?.trim()) {
      return reply.code(400).send({ error: 'Name is required' });
    }
    if (!departmentId) {
      return reply.code(400).send({ error: 'Department ID is required' });
    }

    // Verify department exists
    const [dept] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, departmentId));
    if (!dept) {
      return reply.code(400).send({ error: 'Department not found' });
    }

    const [team] = await db
      .insert(teams)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        departmentId,
      })
      .returning();

    return reply.code(201).send(team);
  });

  // Update team
  fastify.put<{
    Params: { id: string };
    Body: { name?: string; description?: string; departmentId?: number };
  }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const { name, description, departmentId } = request.body;

    const updates: Partial<typeof teams.$inferInsert> = { updatedAt: new Date() };
    if (name?.trim()) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (departmentId) {
      const [dept] = await db
        .select()
        .from(departments)
        .where(eq(departments.id, departmentId));
      if (!dept) {
        return reply.code(400).send({ error: 'Department not found' });
      }
      updates.departmentId = departmentId;
    }

    const [team] = await db
      .update(teams)
      .set(updates)
      .where(eq(teams.id, id))
      .returning();

    if (!team) {
      return reply.code(404).send({ error: 'Team not found' });
    }

    return team;
  });

  // Delete team (blocked if in use by projects)
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);

    // Usage check placeholder (will check projects in Phase 2)
    const usageCount = 0;

    if (usageCount > 0) {
      return reply.code(409).send({
        error: 'Cannot delete',
        message: `Team is used by ${usageCount} project(s)`,
        usageCount,
      });
    }

    const [deleted] = await db
      .delete(teams)
      .where(eq(teams.id, id))
      .returning();

    if (!deleted) {
      return reply.code(404).send({ error: 'Team not found' });
    }

    return { success: true, deleted };
  });
}
