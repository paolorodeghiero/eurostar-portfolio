import type { FastifyInstance } from 'fastify';
import { receiptsRoutes } from './receipts.js';
import { invoicesRoutes } from './invoices.js';

export async function actualsRouter(fastify: FastifyInstance) {
  await fastify.register(receiptsRoutes, { prefix: '/actuals' });
  await fastify.register(invoicesRoutes, { prefix: '/actuals' });
}
