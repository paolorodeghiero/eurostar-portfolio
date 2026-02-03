import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { competenceMonthPatterns } from '../../db/schema.js';

const VALID_COMPANIES = ['THIF', 'EIL'] as const;

export async function competenceMonthPatternsRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // List all competence month patterns
  fastify.get('/', async () => {
    const list = await db.select().from(competenceMonthPatterns);
    return list.map((p) => ({ ...p, usageCount: 0 }));
  });

  // Get single competence month pattern
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const [pattern] = await db.select().from(competenceMonthPatterns).where(eq(competenceMonthPatterns.id, id));
    if (!pattern) return reply.code(404).send({ error: 'Competence month pattern not found' });
    return { ...pattern, usageCount: 0, usedBy: [] };
  });

  // Create competence month pattern
  fastify.post<{
    Body: {
      company: string;
      pattern: string;
      description?: string;
    };
  }>('/', async (request, reply) => {
    const { company, pattern, description } = request.body;

    // Validate company
    if (!VALID_COMPANIES.includes(company as (typeof VALID_COMPANIES)[number])) {
      return reply.code(400).send({ error: `company must be one of: ${VALID_COMPANIES.join(', ')}` });
    }

    // Validate pattern
    if (!pattern?.trim()) {
      return reply.code(400).send({ error: 'pattern is required' });
    }

    const [created] = await db
      .insert(competenceMonthPatterns)
      .values({
        company,
        pattern: pattern.trim(),
        description: description?.trim() || null,
      })
      .returning();
    return reply.code(201).send(created);
  });

  // Update competence month pattern
  fastify.put<{
    Params: { id: string };
    Body: {
      company?: string;
      pattern?: string;
      description?: string;
    };
  }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const { company, pattern, description } = request.body;

    const updates: Partial<typeof competenceMonthPatterns.$inferInsert> = { updatedAt: new Date() };

    if (company !== undefined) {
      if (!VALID_COMPANIES.includes(company as (typeof VALID_COMPANIES)[number])) {
        return reply.code(400).send({ error: `company must be one of: ${VALID_COMPANIES.join(', ')}` });
      }
      updates.company = company;
    }
    if (pattern !== undefined) {
      if (!pattern?.trim()) {
        return reply.code(400).send({ error: 'pattern cannot be empty' });
      }
      updates.pattern = pattern.trim();
    }
    if (description !== undefined) updates.description = description?.trim() || null;

    const [updated] = await db
      .update(competenceMonthPatterns)
      .set(updates)
      .where(eq(competenceMonthPatterns.id, id))
      .returning();

    if (!updated) return reply.code(404).send({ error: 'Competence month pattern not found' });
    return updated;
  });

  // Delete competence month pattern
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);

    const [deleted] = await db.delete(competenceMonthPatterns).where(eq(competenceMonthPatterns.id, id)).returning();
    if (!deleted) return reply.code(404).send({ error: 'Competence month pattern not found' });
    return { success: true, deleted };
  });
}
