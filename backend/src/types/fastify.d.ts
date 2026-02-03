import 'fastify';
import type { db } from '../db/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: typeof db;
  }

  interface FastifyRequest {
    user: {
      id: string;
      email: string;
      name?: string;
      role: 'admin' | 'user';
    };
  }
}
