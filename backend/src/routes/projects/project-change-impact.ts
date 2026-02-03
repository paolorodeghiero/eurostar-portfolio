import type { FastifyInstance } from 'fastify';
import { eq, and, asc } from 'drizzle-orm';
import { projectChangeImpact, teams, departments, projects } from '../../db/schema.js';

const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
type TshirtSize = (typeof TSHIRT_SIZES)[number];

export async function projectChangeImpactRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // List all change impact teams for a project
  fastify.get<{ Params: { projectId: string } }>(
    '/:projectId/change-impact',
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

      const impactList = await db
        .select({
          id: projectChangeImpact.id,
          teamId: projectChangeImpact.teamId,
          teamName: teams.name,
          departmentName: departments.name,
          impactSize: projectChangeImpact.impactSize,
          createdAt: projectChangeImpact.createdAt,
          updatedAt: projectChangeImpact.updatedAt,
        })
        .from(projectChangeImpact)
        .innerJoin(teams, eq(projectChangeImpact.teamId, teams.id))
        .leftJoin(departments, eq(teams.departmentId, departments.id))
        .where(eq(projectChangeImpact.projectId, projectId))
        .orderBy(asc(teams.name));

      return impactList;
    }
  );

  // Add change impact team
  fastify.post<{
    Params: { projectId: string };
    Body: { teamId: number; impactSize: string };
  }>('/:projectId/change-impact', async (request, reply) => {
    const projectId = parseInt(request.params.projectId);
    const { teamId, impactSize } = request.body;

    // Validate impactSize
    if (!TSHIRT_SIZES.includes(impactSize as TshirtSize)) {
      return reply.code(400).send({
        error: 'Invalid impact size',
        message: `Impact size must be one of: ${TSHIRT_SIZES.join(', ')}`,
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

    // Verify team exists
    const [team] = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.id, teamId));

    if (!team) {
      return reply.code(400).send({ error: 'Team not found' });
    }

    // Check if team already has impact entry
    const [existing] = await db
      .select({ id: projectChangeImpact.id })
      .from(projectChangeImpact)
      .where(
        and(
          eq(projectChangeImpact.projectId, projectId),
          eq(projectChangeImpact.teamId, teamId)
        )
      );

    if (existing) {
      return reply.code(409).send({
        error: 'Team already has impact entry',
        message: 'This team already has a change impact entry for this project',
      });
    }

    // Insert new change impact entry
    const [created] = await db
      .insert(projectChangeImpact)
      .values({
        projectId,
        teamId,
        impactSize,
      })
      .returning();

    // Get full team details for response
    const [impactDetails] = await db
      .select({
        id: projectChangeImpact.id,
        teamId: projectChangeImpact.teamId,
        teamName: teams.name,
        departmentName: departments.name,
        impactSize: projectChangeImpact.impactSize,
        createdAt: projectChangeImpact.createdAt,
        updatedAt: projectChangeImpact.updatedAt,
      })
      .from(projectChangeImpact)
      .innerJoin(teams, eq(projectChangeImpact.teamId, teams.id))
      .leftJoin(departments, eq(teams.departmentId, departments.id))
      .where(eq(projectChangeImpact.id, created.id));

    return reply.code(201).send(impactDetails);
  });

  // Update change impact size
  fastify.put<{
    Params: { projectId: string; teamId: string };
    Body: { impactSize: string };
  }>('/:projectId/change-impact/:teamId', async (request, reply) => {
    const projectId = parseInt(request.params.projectId);
    const teamId = parseInt(request.params.teamId);
    const { impactSize } = request.body;

    // Validate impactSize
    if (!TSHIRT_SIZES.includes(impactSize as TshirtSize)) {
      return reply.code(400).send({
        error: 'Invalid impact size',
        message: `Impact size must be one of: ${TSHIRT_SIZES.join(', ')}`,
      });
    }

    // Update the impact entry
    const [updated] = await db
      .update(projectChangeImpact)
      .set({ impactSize, updatedAt: new Date() })
      .where(
        and(
          eq(projectChangeImpact.projectId, projectId),
          eq(projectChangeImpact.teamId, teamId)
        )
      )
      .returning();

    if (!updated) {
      return reply.code(404).send({
        error: 'Change impact entry not found',
        message: 'This team does not have a change impact entry for this project',
      });
    }

    // Get full team details for response
    const [impactDetails] = await db
      .select({
        id: projectChangeImpact.id,
        teamId: projectChangeImpact.teamId,
        teamName: teams.name,
        departmentName: departments.name,
        impactSize: projectChangeImpact.impactSize,
        createdAt: projectChangeImpact.createdAt,
        updatedAt: projectChangeImpact.updatedAt,
      })
      .from(projectChangeImpact)
      .innerJoin(teams, eq(projectChangeImpact.teamId, teams.id))
      .leftJoin(departments, eq(teams.departmentId, departments.id))
      .where(eq(projectChangeImpact.id, updated.id));

    return impactDetails;
  });

  // Remove change impact team
  fastify.delete<{
    Params: { projectId: string; teamId: string };
  }>('/:projectId/change-impact/:teamId', async (request, reply) => {
    const projectId = parseInt(request.params.projectId);
    const teamId = parseInt(request.params.teamId);

    // Check if impact entry exists
    const [existing] = await db
      .select({ id: projectChangeImpact.id })
      .from(projectChangeImpact)
      .where(
        and(
          eq(projectChangeImpact.projectId, projectId),
          eq(projectChangeImpact.teamId, teamId)
        )
      );

    if (!existing) {
      return reply.code(404).send({
        error: 'Change impact entry not found',
        message: 'This team does not have a change impact entry for this project',
      });
    }

    // Delete the impact entry
    await db.delete(projectChangeImpact).where(eq(projectChangeImpact.id, existing.id));

    return { success: true };
  });
}
