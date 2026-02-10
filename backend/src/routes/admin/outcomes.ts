import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { outcomes, projectValues, projects } from '../../db/schema.js';
import * as XLSX from 'xlsx';

export async function outcomesRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // List all outcomes with usage count
  fastify.get('/', async () => {
    const list = await db.select().from(outcomes);
    return list.map((o) => ({ ...o, usageCount: 0 })); // Placeholder until projects exist
  });

  // Get single outcome
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const [outcome] = await db.select().from(outcomes).where(eq(outcomes.id, id));
    if (!outcome) return reply.code(404).send({ error: 'Outcome not found' });
    return { ...outcome, usageCount: 0, usedBy: [] };
  });

  // Create outcome
  fastify.post<{
    Body: {
      name: string;
      score1Example?: string;
      score2Example?: string;
      score3Example?: string;
      score4Example?: string;
      score5Example?: string;
    };
  }>('/', async (request, reply) => {
    const { name, score1Example, score2Example, score3Example, score4Example, score5Example } = request.body;
    if (!name?.trim()) return reply.code(400).send({ error: 'Name is required' });

    const [outcome] = await db
      .insert(outcomes)
      .values({
        name: name.trim(),
        score1Example: score1Example?.trim() || null,
        score2Example: score2Example?.trim() || null,
        score3Example: score3Example?.trim() || null,
        score4Example: score4Example?.trim() || null,
        score5Example: score5Example?.trim() || null,
      })
      .returning();
    return reply.code(201).send(outcome);
  });

  // Update outcome
  fastify.put<{
    Params: { id: string };
    Body: {
      name?: string;
      score1Example?: string;
      score2Example?: string;
      score3Example?: string;
      score4Example?: string;
      score5Example?: string;
    };
  }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const { name, score1Example, score2Example, score3Example, score4Example, score5Example } = request.body;

    const updates: Partial<typeof outcomes.$inferInsert> = { updatedAt: new Date() };
    if (name?.trim()) updates.name = name.trim();
    if (score1Example !== undefined) updates.score1Example = score1Example?.trim() || null;
    if (score2Example !== undefined) updates.score2Example = score2Example?.trim() || null;
    if (score3Example !== undefined) updates.score3Example = score3Example?.trim() || null;
    if (score4Example !== undefined) updates.score4Example = score4Example?.trim() || null;
    if (score5Example !== undefined) updates.score5Example = score5Example?.trim() || null;

    const [outcome] = await db
      .update(outcomes)
      .set(updates)
      .where(eq(outcomes.id, id))
      .returning();

    if (!outcome) return reply.code(404).send({ error: 'Outcome not found' });
    return outcome;
  });

  // Bulk import outcomes from Excel/CSV
  fastify.post('/import', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    try {
      const buffer = await data.toBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<{
        name: string;
        score1Example?: string;
        score2Example?: string;
        score3Example?: string;
        score4Example?: string;
        score5Example?: string;
      }>(sheet);

      if (rows.length === 0) {
        return reply.code(400).send({ error: 'File is empty' });
      }

      const errors: string[] = [];
      const validRows: Array<typeof outcomes.$inferInsert> = [];

      // Validate all rows first
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row.name?.trim()) {
          errors.push(`Row ${i + 2}: Name is required`);
          continue;
        }

        // Check if already exists
        const [existing] = await db
          .select()
          .from(outcomes)
          .where(eq(outcomes.name, row.name.trim()));
        if (existing) {
          errors.push(`Row ${i + 2}: Outcome "${row.name}" already exists`);
          continue;
        }

        validRows.push({
          name: row.name.trim(),
          score1Example: row.score1Example?.trim() || null,
          score2Example: row.score2Example?.trim() || null,
          score3Example: row.score3Example?.trim() || null,
          score4Example: row.score4Example?.trim() || null,
          score5Example: row.score5Example?.trim() || null,
        });
      }

      if (errors.length > 0) {
        return reply.code(400).send({ error: 'Validation failed', errors });
      }

      // Insert all valid rows
      let imported = 0;
      for (const row of validRows) {
        await db.insert(outcomes).values(row);
        imported++;
      }

      return { imported, total: rows.length };
    } catch (error: any) {
      return reply.code(500).send({ error: 'Import failed', message: error.message });
    }
  });

  // Export outcomes as Excel
  fastify.get('/export', async (request, reply) => {
    const items = await db.select().from(outcomes);

    const ws = XLSX.utils.json_to_sheet(
      items.map((o) => ({
        id: o.id,
        name: o.name,
        score1Example: o.score1Example || '',
        score2Example: o.score2Example || '',
        score3Example: o.score3Example || '',
        score4Example: o.score4Example || '',
        score5Example: o.score5Example || '',
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Outcomes');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return reply
      .header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      .header('Content-Disposition', 'attachment; filename="outcomes.xlsx"')
      .send(buffer);
  });

  // Get outcome usage details
  fastify.get<{ Params: { id: string } }>('/:id/usage', async (request, reply) => {
    const id = parseInt(request.params.id);

    // Check if outcome exists
    const [outcome] = await db.select().from(outcomes).where(eq(outcomes.id, id));
    if (!outcome) {
      return reply.code(404).send({ error: 'Outcome not found' });
    }

    // Find projectValues that reference this outcome (direct FK relation)
    const valuesList = await db
      .select({
        id: projectValues.id,
        projectId: projectValues.projectId,
        score: projectValues.score,
      })
      .from(projectValues)
      .where(eq(projectValues.outcomeId, id));

    return { projectValues: valuesList };
  });

  // Delete outcome (blocked if in use)
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const usageCount = 0; // Placeholder until projects exist

    if (usageCount > 0) {
      return reply.code(409).send({
        error: 'Cannot delete',
        message: `Outcome is used by ${usageCount} project(s)`,
        usageCount,
      });
    }

    const [deleted] = await db.delete(outcomes).where(eq(outcomes.id, id)).returning();
    if (!deleted) return reply.code(404).send({ error: 'Outcome not found' });
    return { success: true, deleted };
  });
}
