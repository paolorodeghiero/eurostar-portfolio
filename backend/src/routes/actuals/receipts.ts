import type { FastifyInstance } from 'fastify';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import multipart from '@fastify/multipart';
import * as XLSX from 'xlsx';
import { receipts, projects, currencyRates } from '../../db/schema.js';
import { randomUUID } from 'crypto';
import { convertCurrency } from '../../lib/currency-converter.js';
import {
  validateExcelFile,
  parseExcelBuffer,
  validateReceiptRows,
  type ReceiptRow,
} from '../../lib/excel-parser.js';

export async function receiptsRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // Register multipart plugin for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });

  // GET /api/actuals/receipts/template - Download Excel template for receipts import
  fastify.get('/receipts/template', async (request, reply) => {
    const workbook = XLSX.utils.book_new();
    const data = [
      ['ProjectId', 'ReceiptNumber', 'Amount', 'Currency', 'Date', 'Description'],
      ['PRJ-2026-00001', 'REC-001', 5000, 'EUR', '2026-01-15', 'Office supplies']
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Template');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', 'attachment; filename="receipts-template.xlsx"');
    return reply.send(buffer);
  });

  // GET /api/actuals/receipts - List all receipts with filters
  fastify.get<{
    Querystring: {
      projectId?: string;
      fromDate?: string;
      toDate?: string;
      currency?: string;
      reportCurrency?: string;
    };
  }>('/receipts', async (request) => {
    const { projectId, fromDate, toDate, currency, reportCurrency } = request.query;

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

    // If reportCurrency is provided, add converted amounts
    if (reportCurrency) {
      const resultsWithConversion = await Promise.all(
        result.map(async (receipt) => {
          if (receipt.currency === reportCurrency || !receipt.amount) {
            return { ...receipt, convertedAmount: receipt.amount };
          }
          try {
            const converted = await convertCurrency(
              db,
              receipt.amount,
              receipt.currency,
              reportCurrency
            );
            return { ...receipt, convertedAmount: converted };
          } catch {
            // If conversion fails, return null for converted amount
            return { ...receipt, convertedAmount: null };
          }
        })
      );
      return resultsWithConversion;
    }

    return result;
  });

  // POST /api/actuals/receipts/upload - Upload Excel file with receipts
  fastify.post('/receipts/upload', async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      // Read file buffer
      const buffer = await data.toBuffer();

      // Validate Excel format
      const validation = validateExcelFile(buffer);
      if (!validation.valid) {
        return reply.code(400).send({ error: validation.error });
      }

      // Parse Excel
      const rawData = parseExcelBuffer(buffer);
      const { valid, errors } = validateReceiptRows(rawData);

      if (valid.length === 0) {
        return reply.code(400).send({
          error: 'No valid receipts found in file',
          errors,
        });
      }

      // Process valid receipts
      const importBatch = randomUUID();
      const receiptsToInsert = [];
      const processingErrors: Array<{ row: number; message: string }> = [];

      for (let i = 0; i < valid.length; i++) {
        const row = valid[i];
        const rowNum = errors.length + i + 2;

        // Validate project exists
        const [project] = await db
          .select({ id: projects.id })
          .from(projects)
          .where(eq(projects.projectId, row.ProjectId));

        if (!project) {
          processingErrors.push({
            row: rowNum,
            message: `Project ${row.ProjectId} not found`,
          });
          continue;
        }

        // Validate currency exists
        const [currencyExists] = await db
          .select({ currency: currencyRates.fromCurrency })
          .from(currencyRates)
          .where(eq(currencyRates.fromCurrency, row.Currency))
          .limit(1);

        if (!currencyExists) {
          processingErrors.push({
            row: rowNum,
            message: `Currency ${row.Currency} not found in currency_rates`,
          });
          continue;
        }

        receiptsToInsert.push({
          projectId: project.id,
          receiptNumber: row.ReceiptNumber || null,
          amount: row.Amount.toString(),
          currency: row.Currency,
          receiptDate: row.Date,
          description: row.Description || null,
          importBatch,
        });
      }

      // Insert receipts in transaction
      let imported = 0;
      if (receiptsToInsert.length > 0) {
        try {
          const result = await db.insert(receipts).values(receiptsToInsert).returning();
          imported = result.length;
        } catch (error: any) {
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
        errors: [...errors, ...processingErrors],
        importBatch,
      };
    } catch (error) {
      console.error('Receipt upload error:', error);
      return reply.code(500).send({ error: 'Failed to process file upload' });
    }
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
