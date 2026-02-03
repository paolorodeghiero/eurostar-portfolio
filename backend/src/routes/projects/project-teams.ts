import type { FastifyInstance } from 'fastify';
import { eq, and, asc } from 'drizzle-orm';
import { projectTeams, teams, departments, projects } from '../../db/schema.js';

const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
type TshirtSize = (typeof TSHIRT_SIZES)[number];

export async function projectTeamsRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // List all involved teams for a project
  fastify.get<{ Params: { projectId: string } }>(
    '/:projectId/teams',
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

      const teamsList = await db
        .select({
          id: projectTeams.id,
          teamId: projectTeams.teamId,
          teamName: teams.name,
          departmentName: departments.name,
          effortSize: projectTeams.effortSize,
          isLead: projectTeams.isLead,
          createdAt: projectTeams.createdAt,
          updatedAt: projectTeams.updatedAt,
        })
        .from(projectTeams)
        .innerJoin(teams, eq(projectTeams.teamId, teams.id))
        .leftJoin(departments, eq(teams.departmentId, departments.id))
        .where(eq(projectTeams.projectId, projectId))
        .orderBy(asc(teams.name));

      // Sort: lead team first, then alphabetical by name
      const sorted = teamsList.sort((a, b) => {
        if (a.isLead && !b.isLead) return -1;
        if (!a.isLead && b.isLead) return 1;
        return (a.teamName || '').localeCompare(b.teamName || '');
      });

      return sorted;
    }
  );

  // Add involved team to project
  fastify.post<{
    Params: { projectId: string };
    Body: { teamId: number; effortSize: string };
  }>('/:projectId/teams', async (request, reply) => {
    const projectId = parseInt(request.params.projectId);
    const { teamId, effortSize } = request.body;

    // Validate effortSize
    if (!TSHIRT_SIZES.includes(effortSize as TshirtSize)) {
      return reply.code(400).send({
        error: 'Invalid effort size',
        message: `Effort size must be one of: ${TSHIRT_SIZES.join(', ')}`,
      });
    }

    // Verify project exists and get lead team ID
    const [project] = await db
      .select({ id: projects.id, leadTeamId: projects.leadTeamId })
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    // Check if teamId matches leadTeamId
    if (teamId === project.leadTeamId) {
      return reply.code(400).send({
        error: 'Cannot add lead team',
        message: 'Lead team is automatically added to involved teams',
      });
    }

    // Verify team exists
    const [team] = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.id, teamId));

    if (!team) {
      return reply.code(400).send({ error: 'Team not found' });
    }

    // Check if team already assigned
    const [existing] = await db
      .select({ id: projectTeams.id })
      .from(projectTeams)
      .where(
        and(eq(projectTeams.projectId, projectId), eq(projectTeams.teamId, teamId))
      );

    if (existing) {
      return reply.code(409).send({
        error: 'Team already assigned',
        message: 'This team is already assigned to the project',
      });
    }

    // Insert new project team
    const [created] = await db
      .insert(projectTeams)
      .values({
        projectId,
        teamId,
        effortSize,
        isLead: false,
      })
      .returning();

    // Get full team details for response
    const [teamDetails] = await db
      .select({
        id: projectTeams.id,
        teamId: projectTeams.teamId,
        teamName: teams.name,
        departmentName: departments.name,
        effortSize: projectTeams.effortSize,
        isLead: projectTeams.isLead,
        createdAt: projectTeams.createdAt,
        updatedAt: projectTeams.updatedAt,
      })
      .from(projectTeams)
      .innerJoin(teams, eq(projectTeams.teamId, teams.id))
      .leftJoin(departments, eq(teams.departmentId, departments.id))
      .where(eq(projectTeams.id, created.id));

    return reply.code(201).send(teamDetails);
  });

  // Update team effort size
  fastify.put<{
    Params: { projectId: string; teamId: string };
    Body: { effortSize: string };
  }>('/:projectId/teams/:teamId', async (request, reply) => {
    const projectId = parseInt(request.params.projectId);
    const teamId = parseInt(request.params.teamId);
    const { effortSize } = request.body;

    // Validate effortSize
    if (!TSHIRT_SIZES.includes(effortSize as TshirtSize)) {
      return reply.code(400).send({
        error: 'Invalid effort size',
        message: `Effort size must be one of: ${TSHIRT_SIZES.join(', ')}`,
      });
    }

    // Update the team assignment
    const [updated] = await db
      .update(projectTeams)
      .set({ effortSize, updatedAt: new Date() })
      .where(
        and(eq(projectTeams.projectId, projectId), eq(projectTeams.teamId, teamId))
      )
      .returning();

    if (!updated) {
      return reply.code(404).send({
        error: 'Team assignment not found',
        message: 'This team is not assigned to the project',
      });
    }

    // Get full team details for response
    const [teamDetails] = await db
      .select({
        id: projectTeams.id,
        teamId: projectTeams.teamId,
        teamName: teams.name,
        departmentName: departments.name,
        effortSize: projectTeams.effortSize,
        isLead: projectTeams.isLead,
        createdAt: projectTeams.createdAt,
        updatedAt: projectTeams.updatedAt,
      })
      .from(projectTeams)
      .innerJoin(teams, eq(projectTeams.teamId, teams.id))
      .leftJoin(departments, eq(teams.departmentId, departments.id))
      .where(eq(projectTeams.id, updated.id));

    return teamDetails;
  });

  // Remove involved team from project
  fastify.delete<{
    Params: { projectId: string; teamId: string };
  }>('/:projectId/teams/:teamId', async (request, reply) => {
    const projectId = parseInt(request.params.projectId);
    const teamId = parseInt(request.params.teamId);

    // Check if this is the lead team
    const [teamAssignment] = await db
      .select({ id: projectTeams.id, isLead: projectTeams.isLead })
      .from(projectTeams)
      .where(
        and(eq(projectTeams.projectId, projectId), eq(projectTeams.teamId, teamId))
      );

    if (!teamAssignment) {
      return reply.code(404).send({
        error: 'Team assignment not found',
        message: 'This team is not assigned to the project',
      });
    }

    if (teamAssignment.isLead) {
      return reply.code(400).send({
        error: 'Cannot remove lead team',
        message: 'The lead team cannot be removed from involved teams',
      });
    }

    // Delete the team assignment
    await db
      .delete(projectTeams)
      .where(eq(projectTeams.id, teamAssignment.id));

    return { success: true };
  });
}
