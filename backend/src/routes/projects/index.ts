import { FastifyInstance } from 'fastify';
import { projectRoutes } from './projects.js';

export async function projectsRouter(fastify: FastifyInstance) {
  await fastify.register(projectRoutes, { prefix: '/projects' });
}
