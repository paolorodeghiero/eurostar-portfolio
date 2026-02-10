import type { FastifyInstance } from 'fastify';
import { eq, count } from 'drizzle-orm';
import { departments, teams, projects, statuses } from '../../db/schema.js';

export async function departmentsRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // List all departments with usage count
  fastify.get('/', async () => {
    const depts = await db.select().from(departments);

    // Get usage counts (teams using each department)
    const deptsWithUsage = await Promise.all(
      depts.map(async (dept) => {
        const [result] = await db
          .select({ count: count() })
          .from(teams)
          .where(eq(teams.departmentId, dept.id));
        return { ...dept, usageCount: result.count };
      })
    );

    return deptsWithUsage;
  });

  // Get single department with usage details
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const [dept] = await db.select().from(departments).where(eq(departments.id, id));

    if (!dept) {
      return reply.code(404).send({ error: 'Department not found' });
    }

    const usedBy = await db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .where(eq(teams.departmentId, id));

    return { ...dept, usageCount: usedBy.length, usedBy };
  });

  // Create department
  fastify.post<{ Body: { name: string } }>('/', async (request, reply) => {
    const { name } = request.body;

    if (!name?.trim()) {
      return reply.code(400).send({ error: 'Name is required' });
    }

    const [dept] = await db
      .insert(departments)
      .values({ name: name.trim() })
      .returning();

    return reply.code(201).send(dept);
  });

  // Update department
  fastify.put<{ Params: { id: string }; Body: { name: string } }>(
    '/:id',
    async (request, reply) => {
      const id = parseInt(request.params.id);
      const { name } = request.body;

      if (!name?.trim()) {
        return reply.code(400).send({ error: 'Name is required' });
      }

      const [dept] = await db
        .update(departments)
        .set({ name: name.trim(), updatedAt: new Date() })
        .where(eq(departments.id, id))
        .returning();

      if (!dept) {
        return reply.code(404).send({ error: 'Department not found' });
      }

      return dept;
    }
  );

  // Get department usage details
  fastify.get<{ Params: { id: string } }>('/:id/usage', async (request, reply) => {
    const id = parseInt(request.params.id);

    // Check if department exists
    const [dept] = await db.select().from(departments).where(eq(departments.id, id));
    if (!dept) {
      return reply.code(404).send({ error: 'Department not found' });
    }

    // Find projects where lead team belongs to this department
    const projectsList = await db
      .select({
        id: projects.id,
        projectId: projects.projectId,
        name: projects.name,
        statusName: statuses.name,
      })
      .from(projects)
      .innerJoin(teams, eq(projects.leadTeamId, teams.id))
      .leftJoin(statuses, eq(projects.statusId, statuses.id))
      .where(eq(teams.departmentId, id));

    return { projects: projectsList };
  });

  // Delete department (blocked if in use)
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);

    // Check usage
    const [result] = await db
      .select({ count: count() })
      .from(teams)
      .where(eq(teams.departmentId, id));

    if (result.count > 0) {
      return reply.code(409).send({
        error: 'Cannot delete',
        message: `Department is used by ${result.count} team(s)`,
        usageCount: result.count,
      });
    }

    const [deleted] = await db
      .delete(departments)
      .where(eq(departments.id, id))
      .returning();

    if (!deleted) {
      return reply.code(404).send({ error: 'Department not found' });
    }

    return { success: true, deleted };
  });
}
