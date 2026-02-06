import type { FastifyInstance } from 'fastify';
import { projectRoutes } from './projects.js';
import { projectTeamsRoutes } from './project-teams.js';
import { projectValuesRoutes } from './project-values.js';
import { projectChangeImpactRoutes } from './project-change-impact.js';
import { projectBudgetRoutes } from './project-budget.js';
import { projectCommitteeRoutes } from './project-committee.js';
import { projectFilesRoutes } from './project-files.js';

export async function projectsRouter(fastify: FastifyInstance) {
  await fastify.register(projectRoutes, { prefix: '/projects' });
  await fastify.register(projectTeamsRoutes, { prefix: '/projects' });
  await fastify.register(projectValuesRoutes, { prefix: '/projects' });
  await fastify.register(projectChangeImpactRoutes, { prefix: '/projects' });
  await fastify.register(projectBudgetRoutes, { prefix: '/projects' });
  await fastify.register(projectCommitteeRoutes, { prefix: '/projects' });
  await fastify.register(projectFilesRoutes, { prefix: '/projects' });
}
