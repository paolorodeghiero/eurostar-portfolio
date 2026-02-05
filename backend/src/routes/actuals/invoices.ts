import type { FastifyInstance } from 'fastify';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { invoices, projects, currencyRates } from '../../db/schema.js';
import { extractCompetenceMonth } from '../../lib/competence-month.js';
import { randomUUID } from 'crypto';

export async function invoicesRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // GET /api/actuals/invoices - List all invoices with filters
  fastify.get<{
    Querystring: {
      projectId?: string;
      fromDate?: string;
      toDate?: string;
      extractionFailed?: string;
    };
  }>('/invoices', async (request) => {
    const { projectId, fromDate, toDate, extractionFailed } = request.query;

    // Build base query with project details
    let query = db
      .select({
        id: invoices.id,
        projectId: projects.projectId,
        projectName: projects.name,
        invoiceNumber: invoices.invoiceNumber,
        amount: invoices.amount,
        currency: invoices.currency,
        invoiceDate: invoices.invoiceDate,
        description: invoices.description,
        competenceMonth: invoices.competenceMonth,
        competenceMonthExtracted: invoices.competenceMonthExtracted,
        competenceMonthOverride: invoices.competenceMonthOverride,
        importBatch: invoices.importBatch,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .leftJoin(projects, eq(invoices.projectId, projects.id));

    // Apply filters
    const conditions = [];

    if (projectId) {
      // Convert PRJ-YYYY-XXXXX to internal ID
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.projectId, projectId));

      if (project) {
        conditions.push(eq(invoices.projectId, project.id));
      }
    }

    if (fromDate) {
      conditions.push(gte(invoices.invoiceDate, fromDate));
    }

    if (toDate) {
      conditions.push(lte(invoices.invoiceDate, toDate));
    }

    if (extractionFailed === 'true') {
      conditions.push(eq(invoices.competenceMonthExtracted, false));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const result = await query;
    return result;
  });

  // POST /api/actuals/invoices/import - Batch import invoices with competence month extraction
  fastify.post<{
    Body: Array<{
      projectId: string;
      invoiceNumber: string;
      amount: number;
      currency: string;
      invoiceDate: string;
      description: string;
      company?: string;
    }>;
  }>('/invoices/import', async (request, reply) => {
    const invoicesData = request.body;

    if (!Array.isArray(invoicesData) || invoicesData.length === 0) {
      return reply.code(400).send({ error: 'Request body must be a non-empty array' });
    }

    const importBatch = randomUUID();
    const errors: Array<{ index: number; message: string }> = [];
    const validInvoices = [];
    let extractionWarnings = 0;

    // Validate each invoice
    for (let i = 0; i < invoicesData.length; i++) {
      const invoice = invoicesData[i];
      const index = i;

      // Validate projectId exists
      if (!invoice.projectId) {
        errors.push({ index, message: 'projectId is required' });
        continue;
      }

      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.projectId, invoice.projectId));

      if (!project) {
        errors.push({ index, message: `Project ${invoice.projectId} not found` });
        continue;
      }

      // Validate currency exists
      if (!invoice.currency) {
        errors.push({ index, message: 'currency is required' });
        continue;
      }

      const [currencyExists] = await db
        .select({ currency: currencyRates.fromCurrency })
        .from(currencyRates)
        .where(eq(currencyRates.fromCurrency, invoice.currency))
        .limit(1);

      if (!currencyExists) {
        errors.push({ index, message: `Currency ${invoice.currency} not found in currency_rates` });
        continue;
      }

      // Validate amount is positive
      if (!invoice.amount || invoice.amount <= 0) {
        errors.push({ index, message: 'amount must be positive' });
        continue;
      }

      // Validate required fields
      if (!invoice.invoiceNumber) {
        errors.push({ index, message: 'invoiceNumber is required' });
        continue;
      }

      if (!invoice.invoiceDate) {
        errors.push({ index, message: 'invoiceDate is required' });
        continue;
      }

      if (!invoice.description) {
        errors.push({ index, message: 'description is required' });
        continue;
      }

      // Extract competence month if company provided
      let competenceMonth = null;
      let competenceMonthExtracted = false;

      if (invoice.company && invoice.description) {
        const extraction = await extractCompetenceMonth(
          db,
          invoice.description,
          invoice.company
        );
        competenceMonth = extraction.month;
        competenceMonthExtracted = extraction.extracted;

        if (!competenceMonthExtracted) {
          extractionWarnings++;
        }
      } else {
        // No company provided, can't extract
        extractionWarnings++;
      }

      // Valid invoice - add to batch
      validInvoices.push({
        projectId: project.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount.toString(), // Store as string for NUMERIC
        currency: invoice.currency,
        invoiceDate: invoice.invoiceDate,
        description: invoice.description,
        competenceMonth,
        competenceMonthExtracted,
        competenceMonthOverride: null,
        importBatch,
      });
    }

    // Insert valid invoices
    let imported = 0;
    if (validInvoices.length > 0) {
      try {
        const result = await db.insert(invoices).values(validInvoices).returning();
        imported = result.length;
      } catch (error: any) {
        // Handle unique constraint violations
        if (error.code === '23505') {
          return reply.code(400).send({
            error: 'Duplicate invoice detected',
            message: 'One or more invoices with the same projectId, invoiceNumber, and amount already exist',
          });
        }
        throw error;
      }
    }

    return {
      imported,
      errors,
      extractionWarnings,
      importBatch,
    };
  });

  // PUT /api/actuals/invoices/:id/competence-month - Update competence month override
  fastify.put<{
    Params: { id: string };
    Body: { competenceMonth: string };
  }>('/invoices/:id/competence-month', async (request, reply) => {
    const id = parseInt(request.params.id);
    const { competenceMonth } = request.body;

    if (!competenceMonth) {
      return reply.code(400).send({ error: 'competenceMonth is required' });
    }

    // Validate format YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(competenceMonth)) {
      return reply.code(400).send({ error: 'competenceMonth must be in YYYY-MM format' });
    }

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));

    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    const [updated] = await db
      .update(invoices)
      .set({ competenceMonthOverride: competenceMonth })
      .where(eq(invoices.id, id))
      .returning();

    return updated;
  });

  // DELETE /api/actuals/invoices/:id - Delete single invoice
  fastify.delete<{
    Params: { id: string };
  }>('/invoices/:id', async (request, reply) => {
    const id = parseInt(request.params.id);

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));

    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    await db.delete(invoices).where(eq(invoices.id, id));

    return { success: true };
  });
}
