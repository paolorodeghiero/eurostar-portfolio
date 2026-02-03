import type { FastifyInstance } from 'fastify';
import { eq, and, asc } from 'drizzle-orm';
import { projectValues, outcomes, projects } from '../../db/schema.js';

export async function projectValuesRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // List all value scores for a project
  fastify.get<{ Params: { projectId: string } }>(
    '/:projectId/values',
    async (request, reply) => {
      const projectId = parseInt(request.params.projectId);

      // Verify project exists
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.id, projectId));

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      const valuesList = await db
        .select({
          id: projectValues.id,
          outcomeId: projectValues.outcomeId,
          outcomeName: outcomes.name,
          score1Example: outcomes.score1Example,
          score2Example: outcomes.score2Example,
          score3Example: outcomes.score3Example,
          score4Example: outcomes.score4Example,
          score5Example: outcomes.score5Example,
          score: projectValues.score,
          justification: projectValues.justification,
          createdAt: projectValues.createdAt,
          updatedAt: projectValues.updatedAt,
        })
        .from(projectValues)
        .innerJoin(outcomes, eq(projectValues.outcomeId, outcomes.id))
        .where(eq(projectValues.projectId, projectId))
        .orderBy(asc(outcomes.name));

      return valuesList;
    }
  );

  // Set/update value score (upsert)
  fastify.put<{
    Params: { projectId: string; outcomeId: string };
    Body: { score: number; justification?: string };
  }>('/:projectId/values/:outcomeId', async (request, reply) => {
    const projectId = parseInt(request.params.projectId);
    const outcomeId = parseInt(request.params.outcomeId);
    const { score, justification } = request.body;

    // Validate score
    if (score < 1 || score > 5 || !Number.isInteger(score)) {
      return reply.code(400).send({
        error: 'Invalid score',
        message: 'Score must be an integer between 1 and 5',
      });
    }

    // Verify project exists
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    // Verify outcome exists
    const [outcome] = await db
      .select({ id: outcomes.id })
      .from(outcomes)
      .where(eq(outcomes.id, outcomeId));

    if (!outcome) {
      return reply.code(400).send({ error: 'Outcome not found' });
    }

    // Upsert the value score
    await db
      .insert(projectValues)
      .values({
        projectId,
        outcomeId,
        score,
        justification: justification ?? null,
      })
      .onConflictDoUpdate({
        target: [projectValues.projectId, projectValues.outcomeId],
        set: {
          score,
          justification: justification ?? null,
          updatedAt: new Date(),
        },
      });

    // Get the value with outcome details for response
    const [valueDetails] = await db
      .select({
        id: projectValues.id,
        outcomeId: projectValues.outcomeId,
        outcomeName: outcomes.name,
        score1Example: outcomes.score1Example,
        score2Example: outcomes.score2Example,
        score3Example: outcomes.score3Example,
        score4Example: outcomes.score4Example,
        score5Example: outcomes.score5Example,
        score: projectValues.score,
        justification: projectValues.justification,
        createdAt: projectValues.createdAt,
        updatedAt: projectValues.updatedAt,
      })
      .from(projectValues)
      .innerJoin(outcomes, eq(projectValues.outcomeId, outcomes.id))
      .where(
        and(
          eq(projectValues.projectId, projectId),
          eq(projectValues.outcomeId, outcomeId)
        )
      );

    return valueDetails;
  });

  // Remove value score
  fastify.delete<{
    Params: { projectId: string; outcomeId: string };
  }>('/:projectId/values/:outcomeId', async (request, reply) => {
    const projectId = parseInt(request.params.projectId);
    const outcomeId = parseInt(request.params.outcomeId);

    // Check if value score exists
    const [existing] = await db
      .select({ id: projectValues.id })
      .from(projectValues)
      .where(
        and(
          eq(projectValues.projectId, projectId),
          eq(projectValues.outcomeId, outcomeId)
        )
      );

    if (!existing) {
      return reply.code(404).send({
        error: 'Value score not found',
        message: 'No score exists for this outcome on this project',
      });
    }

    // Delete the value score
    await db.delete(projectValues).where(eq(projectValues.id, existing.id));

    return { success: true };
  });
}
