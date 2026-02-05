import type { FastifyInstance } from 'fastify';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { receipts, projects, currencyRates } from '../../db/schema.js';
import { randomUUID } from 'crypto';

export async function receiptsRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // GET /api/actuals/receipts - List all receipts with filters
  fastify.get<{
    Querystring: {
      projectId?: string;
      fromDate?: string;
      toDate?: string;
      currency?: string;
    };
  }>('/receipts', async (request) => {
    const { projectId, fromDate, toDate, currency } = request.query;

    // Build base query with project details
    let query = db
      .select({
        id: receipts.id,
        projectId: projects.projectId,
        projectName: projects.name,
        receiptNumber: receipts.receiptNumber,
        amount: receipts.amount,
        currency: receipts.currency,
        receiptDate: receipts.receiptDate,
        description: receipts.description,
        importBatch: receipts.importBatch,
        createdAt: receipts.createdAt,
      })
      .from(receipts)
      .leftJoin(projects, eq(receipts.projectId, projects.id));

    // Apply filters
    const conditions = [];

    if (projectId) {
      // Convert PRJ-YYYY-XXXXX to internal ID
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.projectId, projectId));

      if (project) {
        conditions.push(eq(receipts.projectId, project.id));
      }
    }

    if (fromDate) {
      conditions.push(gte(receipts.receiptDate, fromDate));
    }

    if (toDate) {
      conditions.push(lte(receipts.receiptDate, toDate));
    }

    if (currency) {
      conditions.push(eq(receipts.currency, currency));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const result = await query;
    return result;
  });

  // POST /api/actuals/receipts/import - Batch import receipts
  fastify.post<{
    Body: Array<{
      projectId: string;
      receiptNumber?: string;
      amount: number;
      currency: string;
      receiptDate: string;
      description?: string;
    }>;
  }>('/receipts/import', async (request, reply) => {
    const receiptsData = request.body;

    if (!Array.isArray(receiptsData) || receiptsData.length === 0) {
      return reply.code(400).send({ error: 'Request body must be a non-empty array' });
    }

    const importBatch = randomUUID();
    const errors: Array<{ index: number; message: string }> = [];
    const validReceipts = [];

    // Validate each receipt
    for (let i = 0; i < receiptsData.length; i++) {
      const receipt = receiptsData[i];
      const index = i;

      // Validate projectId exists
      if (!receipt.projectId) {
        errors.push({ index, message: 'projectId is required' });
        continue;
      }

      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.projectId, receipt.projectId));

      if (!project) {
        errors.push({ index, message: `Project ${receipt.projectId} not found` });
        continue;
      }

      // Validate currency exists
      if (!receipt.currency) {
        errors.push({ index, message: 'currency is required' });
        continue;
      }

      const [currencyExists] = await db
        .select({ currency: currencyRates.fromCurrency })
        .from(currencyRates)
        .where(eq(currencyRates.fromCurrency, receipt.currency))
        .limit(1);

      if (!currencyExists) {
        errors.push({ index, message: `Currency ${receipt.currency} not found in currency_rates` });
        continue;
      }

      // Validate amount is positive
      if (!receipt.amount || receipt.amount <= 0) {
        errors.push({ index, message: 'amount must be positive' });
        continue;
      }

      // Validate receiptDate
      if (!receipt.receiptDate) {
        errors.push({ index, message: 'receiptDate is required' });
        continue;
      }

      // Valid receipt - add to batch
      validReceipts.push({
        projectId: project.id,
        receiptNumber: receipt.receiptNumber || null,
        amount: receipt.amount.toString(), // Store as string for NUMERIC
        currency: receipt.currency,
        receiptDate: receipt.receiptDate,
        description: receipt.description || null,
        importBatch,
      });
    }

    // Insert valid receipts
    let imported = 0;
    if (validReceipts.length > 0) {
      try {
        const result = await db.insert(receipts).values(validReceipts).returning();
        imported = result.length;
      } catch (error: any) {
        // Handle unique constraint violations
        if (error.code === '23505') {
          return reply.code(400).send({
            error: 'Duplicate receipt detected',
            message: 'One or more receipts with the same projectId and receiptNumber already exist',
          });
        }
        throw error;
      }
    }

    return {
      imported,
      errors,
      importBatch,
    };
  });

  // DELETE /api/actuals/receipts/:id - Delete single receipt
  fastify.delete<{
    Params: { id: string };
  }>('/receipts/:id', async (request, reply) => {
    const id = parseInt(request.params.id);

    const [receipt] = await db
      .select()
      .from(receipts)
      .where(eq(receipts.id, id));

    if (!receipt) {
      return reply.code(404).send({ error: 'Receipt not found' });
    }

    await db.delete(receipts).where(eq(receipts.id, id));

    return { success: true };
  });
}
