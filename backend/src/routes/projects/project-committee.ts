import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { projects } from '../../db/schema.js';
import {
  canTransition,
  getAllowedTransitions,
  isValidCommitteeState,
  type CommitteeState,
} from '../../lib/committee.js';

export async function projectCommitteeRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // GET /api/projects/:id/committee - Get committee status and allowed transitions
  fastify.get<{ Params: { id: string } }>(
    '/:id/committee',
    async (request, reply) => {
      const id = parseInt(request.params.id);

      const [project] = await db
        .select({
          id: projects.id,
          committeeState: projects.committeeState,
          committeeLevel: projects.committeeLevel,
          businessCaseFile: projects.businessCaseFile,
        })
        .from(projects)
        .where(eq(projects.id, id));

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      const currentState = project.committeeState as CommitteeState | null;
      const allowedTransitions = getAllowedTransitions(currentState);

      return {
        committeeState: project.committeeState,
        committeeLevel: project.committeeLevel,
        businessCaseFile: project.businessCaseFile,
        allowedTransitions,
      };
    }
  );

  // PATCH /api/projects/:id/committee-state - Transition committee state
  fastify.patch<{
    Params: { id: string };
    Body: { committeeState: string };
  }>(
    '/:id/committee-state',
    async (request, reply) => {
      const id = parseInt(request.params.id);
      const { committeeState: newState } = request.body;

      // Validate state value
      if (!isValidCommitteeState(newState)) {
        return reply.code(400).send({
          error: 'Invalid committee state',
          validStates: ['draft', 'presented', 'discussion', 'approved', 'rejected'],
        });
      }

      // Get current project
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id));

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      const currentState = project.committeeState as CommitteeState | null;

      // Validate transition
      if (!canTransition(currentState, newState)) {
        const allowed = getAllowedTransitions(currentState);
        return reply.code(400).send({
          error: `Invalid transition from '${currentState || 'none'}' to '${newState}'`,
          allowedTransitions: allowed,
        });
      }

      // Get user email
      const userEmail = request.user?.email || 'dev-user';

      // Update with optimistic locking
      const [updated] = await db
        .update(projects)
        .set({
          committeeState: newState,
          version: project.version + 1,
          updatedBy: userEmail,
          updatedAt: new Date(),
        })
        .where(and(eq(projects.id, id), eq(projects.version, project.version)))
        .returning();

      if (!updated) {
        return reply.code(409).send({ error: 'Concurrent modification detected' });
      }

      return {
        id: updated.id,
        committeeState: updated.committeeState,
        allowedTransitions: getAllowedTransitions(updated.committeeState as CommitteeState),
        version: updated.version,
      };
    }
  );
}
