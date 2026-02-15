import type { FastifyRequest, FastifyReply } from 'fastify';

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  console.log('[requireAdmin] User:', request.user);
  if (!request.user || request.user.role !== 'admin') {
    console.log('[requireAdmin] Access denied - role:', request.user?.role);
    return reply.code(403).send({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }
}
