import type { FastifyInstance } from 'fastify';
import { alertRoutes } from './alerts.js';

export async function alertsPlugin(fastify: FastifyInstance) {
  await fastify.register(alertRoutes, { prefix: '/alerts' });
}
