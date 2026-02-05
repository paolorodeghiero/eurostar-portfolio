import type { FastifyInstance } from 'fastify';
import { eq, sql, and, count as drizzleCount } from 'drizzle-orm';
import multipart from '@fastify/multipart';
import {
  budgetLines,
  departments,
  costCenters,
  currencyRates,
  projectBudgetAllocations,
  projects,
} from '../../db/schema.js';
import {
  validateExcelFile,
  parseExcelBuffer,
  validateBudgetLineRows,
  type BudgetLineRow,
} from '../../lib/excel-parser.js';

export async function budgetLinesRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // Register multipart plugin for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });

  // List all budget lines with joins and filters
  fastify.get<{
    Querystring: {
      fiscalYear?: string;
      company?: string;
      type?: string;
    };
  }>('/', async (request) => {
    const { fiscalYear, company, type } = request.query;

    // Build where conditions
    const conditions = [];
    if (fiscalYear) {
      conditions.push(eq(budgetLines.fiscalYear, parseInt(fiscalYear)));
    }
    if (company) {
      conditions.push(eq(budgetLines.company, company));
    }
    if (type) {
      conditions.push(eq(budgetLines.type, type));
    }

    // Get budget lines with department and cost center details
    const lines = await db
      .select({
        id: budgetLines.id,
        company: budgetLines.company,
        departmentId: budgetLines.departmentId,
        departmentName: departments.name,
        costCenterId: budgetLines.costCenterId,
        costCenterCode: costCenters.code,
        lineValue: budgetLines.lineValue,
        lineAmount: budgetLines.lineAmount,
        currency: budgetLines.currency,
        type: budgetLines.type,
        fiscalYear: budgetLines.fiscalYear,
        createdAt: budgetLines.createdAt,
        updatedAt: budgetLines.updatedAt,
      })
      .from(budgetLines)
      .leftJoin(departments, eq(budgetLines.departmentId, departments.id))
      .leftJoin(costCenters, eq(budgetLines.costCenterId, costCenters.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Calculate allocated and available amounts for each line
    const linesWithAllocations = await Promise.all(
      lines.map(async (line) => {
        const [allocation] = await db
          .select({
            allocated: sql<string>`COALESCE(SUM(${projectBudgetAllocations.allocationAmount}), 0)`,
          })
          .from(projectBudgetAllocations)
          .where(eq(projectBudgetAllocations.budgetLineId, line.id));

        const allocatedAmount = parseFloat(allocation?.allocated || '0');
        const lineAmount = parseFloat(line.lineAmount || '0');
        const availableAmount = lineAmount - allocatedAmount;

        return {
          ...line,
          allocatedAmount: allocatedAmount.toFixed(2),
          availableAmount: availableAmount.toFixed(2),
        };
      })
    );

    return linesWithAllocations;
  });

  // Get single budget line with details
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);

    const [line] = await db
      .select({
        id: budgetLines.id,
        company: budgetLines.company,
        departmentId: budgetLines.departmentId,
        departmentName: departments.name,
        costCenterId: budgetLines.costCenterId,
        costCenterCode: costCenters.code,
        costCenterDescription: costCenters.description,
        lineValue: budgetLines.lineValue,
        lineAmount: budgetLines.lineAmount,
        currency: budgetLines.currency,
        type: budgetLines.type,
        fiscalYear: budgetLines.fiscalYear,
        createdAt: budgetLines.createdAt,
        updatedAt: budgetLines.updatedAt,
      })
      .from(budgetLines)
      .leftJoin(departments, eq(budgetLines.departmentId, departments.id))
      .leftJoin(costCenters, eq(budgetLines.costCenterId, costCenters.id))
      .where(eq(budgetLines.id, id));

    if (!line) {
      return reply.code(404).send({ error: 'Budget line not found' });
    }

    // Get allocated amount
    const [allocation] = await db
      .select({
        allocated: sql<string>`COALESCE(SUM(${projectBudgetAllocations.allocationAmount}), 0)`,
      })
      .from(projectBudgetAllocations)
      .where(eq(projectBudgetAllocations.budgetLineId, id));

    const allocatedAmount = parseFloat(allocation?.allocated || '0');
    const lineAmount = parseFloat(line.lineAmount || '0');
    const availableAmount = lineAmount - allocatedAmount;

    // Get projects using this budget line
    const usedByProjects = await db
      .select({
        projectId: projects.id,
        projectName: projects.name,
        projectDisplayId: projects.projectId,
        allocationAmount: projectBudgetAllocations.allocationAmount,
      })
      .from(projectBudgetAllocations)
      .leftJoin(projects, eq(projectBudgetAllocations.projectId, projects.id))
      .where(eq(projectBudgetAllocations.budgetLineId, id));

    return {
      ...line,
      allocatedAmount: allocatedAmount.toFixed(2),
      availableAmount: availableAmount.toFixed(2),
      usedByProjects,
    };
  });

  // Import budget lines from Excel
  fastify.post('/import', async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    // Read file buffer
    const buffer = await data.toBuffer();

    // Validate file format
    const fileValidation = validateExcelFile(buffer);
    if (!fileValidation.valid) {
      return reply.code(400).send({ error: fileValidation.error });
    }

    // Parse Excel
    let rawData: any[];
    try {
      rawData = parseExcelBuffer(buffer);
    } catch (error) {
      return reply.code(400).send({ error: 'Failed to parse Excel file' });
    }

    if (rawData.length === 0) {
      return reply.code(400).send({ error: 'Excel file is empty' });
    }

    // Validate rows
    const validation = validateBudgetLineRows(rawData);
    const importErrors: Array<{ row: number; message: string }> = [...validation.errors];

    // Process valid rows
    const rowsToImport: Array<{
      company: string;
      departmentId: number;
      costCenterId: number;
      lineValue: string;
      lineAmount: string;
      currency: string;
      type: string;
      fiscalYear: number;
    }> = [];

    for (const [index, row] of validation.valid.entries()) {
      const rowNumber = index + 2; // Excel row number

      // Look up department by name
      const [dept] = await db
        .select()
        .from(departments)
        .where(eq(departments.name, row.Department));

      if (!dept) {
        importErrors.push({
          row: rowNumber,
          message: `Department "${row.Department}" not found`,
        });
        continue;
      }

      // Look up cost center by code
      const [cc] = await db
        .select()
        .from(costCenters)
        .where(eq(costCenters.code, row.CostCenter));

      if (!cc) {
        importErrors.push({
          row: rowNumber,
          message: `Cost center "${row.CostCenter}" not found`,
        });
        continue;
      }

      // Validate currency exists (check if any rate exists for this currency)
      const [currencyExists] = await db
        .select({ count: drizzleCount() })
        .from(currencyRates)
        .where(eq(currencyRates.fromCurrency, row.Currency));

      if (currencyExists.count === 0) {
        importErrors.push({
          row: rowNumber,
          message: `Currency "${row.Currency}" not found in currency rates`,
        });
        continue;
      }

      // Add to import list
      rowsToImport.push({
        company: row.Company,
        departmentId: dept.id,
        costCenterId: cc.id,
        lineValue: row.LineValue,
        lineAmount: row.Amount.toFixed(2),
        currency: row.Currency,
        type: row.Type,
        fiscalYear: row.FiscalYear,
      });
    }

    // Import valid rows in transaction
    let importedCount = 0;
    if (rowsToImport.length > 0) {
      try {
        await db.transaction(async (tx) => {
          for (const row of rowsToImport) {
            await tx.insert(budgetLines).values(row);
            importedCount++;
          }
        });
      } catch (error: any) {
        // Handle unique constraint violations
        if (error.code === '23505') {
          return reply.code(400).send({
            error: 'Duplicate budget line detected',
            message:
              'One or more budget lines already exist (same company, cost center, line value, and fiscal year)',
          });
        }
        throw error;
      }
    }

    return {
      imported: importedCount,
      errors: importErrors,
      totalRows: rawData.length,
    };
  });

  // Delete budget line (blocked if allocated)
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);

    // Check if any allocations exist
    const [result] = await db
      .select({ count: drizzleCount() })
      .from(projectBudgetAllocations)
      .where(eq(projectBudgetAllocations.budgetLineId, id));

    if (result.count > 0) {
      return reply.code(409).send({
        error: 'Cannot delete',
        message: `Budget line is used by ${result.count} project allocation(s)`,
        usageCount: result.count,
      });
    }

    const [deleted] = await db
      .delete(budgetLines)
      .where(eq(budgetLines.id, id))
      .returning();

    if (!deleted) {
      return reply.code(404).send({ error: 'Budget line not found' });
    }

    return { success: true, deleted };
  });
}
