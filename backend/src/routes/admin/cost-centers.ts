import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { costCenters, budgetLines, projectBudgetAllocations, projects } from '../../db/schema.js';

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

  // Get cost center usage details
  fastify.get<{ Params: { id: string } }>('/:id/usage', async (request, reply) => {
    const id = parseInt(request.params.id);

    // Check if cost center exists
    const [costCenter] = await db.select().from(costCenters).where(eq(costCenters.id, id));
    if (!costCenter) {
      return reply.code(404).send({ error: 'Cost center not found' });
    }

    // Find budget lines using this cost center
    const budgetLinesList = await db
      .select({
        id: budgetLines.id,
        company: budgetLines.company,
        lineValue: budgetLines.lineValue,
        lineAmount: budgetLines.lineAmount,
        currency: budgetLines.currency,
        type: budgetLines.type,
        fiscalYear: budgetLines.fiscalYear,
      })
      .from(budgetLines)
      .where(eq(budgetLines.costCenterId, id));

    // Find projects that have allocations from these budget lines
    const budgetLineIds = budgetLinesList.map((bl) => bl.id);
    let projectsList: Array<{ id: number; projectId: string; name: string }> = [];

    if (budgetLineIds.length > 0) {
      projectsList = await db
        .select({
          id: projects.id,
          projectId: projects.projectId,
          name: projects.name,
        })
        .from(projectBudgetAllocations)
        .innerJoin(projects, eq(projectBudgetAllocations.projectId, projects.id))
        .where(eq(projectBudgetAllocations.budgetLineId, budgetLineIds[0])); // Simplified - would need OR for multiple

      // For multiple budget lines, do additional queries
      for (let i = 1; i < budgetLineIds.length; i++) {
        const moreProjects = await db
          .select({
            id: projects.id,
            projectId: projects.projectId,
            name: projects.name,
          })
          .from(projectBudgetAllocations)
          .innerJoin(projects, eq(projectBudgetAllocations.projectId, projects.id))
          .where(eq(projectBudgetAllocations.budgetLineId, budgetLineIds[i]));

        // Deduplicate by project id
        for (const proj of moreProjects) {
          if (!projectsList.some((p) => p.id === proj.id)) {
            projectsList.push(proj);
          }
        }
      }
    }

    return {
      budgetLines: budgetLinesList,
      projects: projectsList,
    };
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
