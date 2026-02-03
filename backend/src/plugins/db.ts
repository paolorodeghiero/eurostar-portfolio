import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';

async function dbPluginHandler(fastify: FastifyInstance): Promise<void> {
  fastify.decorate('db', db);
}

export const dbPlugin = fp(dbPluginHandler, {
  name: 'db-plugin',
});
