import type { FastifyRequest, FastifyReply } from 'fastify';

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (request.user.role !== 'admin') {
    return reply.code(403).send({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }
}
