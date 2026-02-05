import type { FastifyInstance } from 'fastify';
import { eq, and, sql } from 'drizzle-orm';
import {
  projects,
  projectBudgetAllocations,
  budgetLines,
  departments,
  costCenters,
} from '../../db/schema.js';
import { deriveCostTshirt } from '../../lib/cost-tshirt.js';
import { convertCurrency } from '../../lib/currency-converter.js';

export async function projectBudgetRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // GET /api/projects/:projectId/budget
  // Returns project budget with allocations and match status
  fastify.get<{ Params: { projectId: string } }>(
    '/:projectId/budget',
    async (request, reply) => {
      const projectId = parseInt(request.params.projectId);

      // Get project budget fields including startDate for exchange rate lookup
      const [project] = await db
        .select({
          id: projects.id,
          opexBudget: projects.opexBudget,
          capexBudget: projects.capexBudget,
          budgetCurrency: projects.budgetCurrency,
          reportCurrency: projects.reportCurrency,
          costTshirt: projects.costTshirt,
          startDate: projects.startDate,
        })
        .from(projects)
        .where(eq(projects.id, projectId));

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      // Get allocations with budget line details
      const rawAllocations = await db
        .select({
          id: projectBudgetAllocations.id,
          budgetLineId: projectBudgetAllocations.budgetLineId,
          allocationAmount: projectBudgetAllocations.allocationAmount,
          lineValue: budgetLines.lineValue,
          company: budgetLines.company,
          lineAmount: budgetLines.lineAmount,
          currency: budgetLines.currency,
          type: budgetLines.type,
          fiscalYear: budgetLines.fiscalYear,
          departmentName: departments.name,
          costCenterCode: costCenters.code,
        })
        .from(projectBudgetAllocations)
        .innerJoin(
          budgetLines,
          eq(projectBudgetAllocations.budgetLineId, budgetLines.id)
        )
        .leftJoin(departments, eq(budgetLines.departmentId, departments.id))
        .leftJoin(costCenters, eq(budgetLines.costCenterId, costCenters.id))
        .where(eq(projectBudgetAllocations.projectId, projectId));

      // Project start date for budget conversion
      const projectStartDate = project.startDate ? new Date(project.startDate) : undefined;

      // Convert allocations to reportCurrency if set
      // Each allocation uses the beginning of its fiscal year for exchange rate
      const allocations = await Promise.all(
        rawAllocations.map(async (alloc) => {
          let convertedAmount: string | undefined;

          if (project.reportCurrency && alloc.currency !== project.reportCurrency) {
            try {
              // Use beginning of fiscal year for allocation conversion
              const fiscalYearStart = alloc.fiscalYear
                ? new Date(`${alloc.fiscalYear}-01-01`)
                : undefined;
              convertedAmount = await convertCurrency(
                db,
                alloc.allocationAmount,
                alloc.currency,
                project.reportCurrency,
                fiscalYearStart
              );
            } catch (err) {
              // If conversion fails, leave convertedAmount undefined
              console.error(`Failed to convert ${alloc.currency} to ${project.reportCurrency}:`, err);
            }
          }

          return {
            ...alloc,
            convertedAmount,
          };
        })
      );

      // Calculate totalBudget and totalAllocated
      // Project budget is always stored in EUR, convert to reportCurrency using project start date
      const opex = project.opexBudget ? parseFloat(project.opexBudget) : 0;
      const capex = project.capexBudget ? parseFloat(project.capexBudget) : 0;
      const totalBudgetRaw = (opex + capex).toFixed(2);
      const budgetSourceCurrency = 'EUR'; // Project budget is always stored in EUR

      // Convert budget values to reportCurrency if needed
      let convertedOpex: string | undefined;
      let convertedCapex: string | undefined;
      let totalBudget = totalBudgetRaw;

      if (project.reportCurrency && project.reportCurrency !== budgetSourceCurrency) {
        try {
          if (project.opexBudget) {
            convertedOpex = await convertCurrency(
              db,
              project.opexBudget,
              budgetSourceCurrency,
              project.reportCurrency,
              projectStartDate
            );
          }
          if (project.capexBudget) {
            convertedCapex = await convertCurrency(
              db,
              project.capexBudget,
              budgetSourceCurrency,
              project.reportCurrency,
              projectStartDate
            );
          }
          // Calculate total in reportCurrency
          const opexConverted = convertedOpex ? parseFloat(convertedOpex) : 0;
          const capexConverted = convertedCapex ? parseFloat(convertedCapex) : 0;
          totalBudget = (opexConverted + capexConverted).toFixed(2);
        } catch (err) {
          console.error(`Failed to convert budget from ${budgetSourceCurrency} to ${project.reportCurrency}:`, err);
          // Fall back to raw values
        }
      }

      const totalAllocated = allocations
        .reduce((sum, alloc) => {
          // Use convertedAmount if available (reportCurrency set), otherwise use original
          const amount = alloc.convertedAmount || alloc.allocationAmount;
          return sum + parseFloat(amount);
        }, 0)
        .toFixed(2);

      const allocationMatch = totalBudget === totalAllocated;

      return {
        opexBudget: project.opexBudget,
        capexBudget: project.capexBudget,
        convertedOpex,
        convertedCapex,
        budgetCurrency: project.budgetCurrency,
        reportCurrency: project.reportCurrency,
        costTshirt: project.costTshirt,
        totalBudget,
        totalAllocated,
        allocationMatch,
        allocations,
      };
    }
  );

  // PUT /api/projects/:projectId/budget
  // Updates OPEX/CAPEX budget and auto-derives cost T-shirt
  fastify.put<{
    Params: { projectId: string };
    Body: {
      opexBudget?: string;
      capexBudget?: string;
      budgetCurrency?: string;
      reportCurrency?: string;
    };
  }>('/:projectId/budget', async (request, reply) => {
    const projectId = parseInt(request.params.projectId);
    const { opexBudget, capexBudget, budgetCurrency, reportCurrency } = request.body;

    // Verify project exists
    const [project] = await db
      .select({
        id: projects.id,
        version: projects.version,
        opexBudget: projects.opexBudget,
        capexBudget: projects.capexBudget,
        budgetCurrency: projects.budgetCurrency,
      })
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    // Validate reportCurrency if provided
    if (reportCurrency !== undefined && reportCurrency !== null) {
      if (reportCurrency !== 'GBP' && reportCurrency !== 'EUR') {
        return reply.code(400).send({ error: 'reportCurrency must be GBP or EUR' });
      }
    }

    // Use existing values if not provided in request
    const finalOpex = opexBudget !== undefined ? opexBudget : project.opexBudget;
    const finalCapex = capexBudget !== undefined ? capexBudget : project.capexBudget;
    const finalBudgetCurrency = budgetCurrency !== undefined ? budgetCurrency : project.budgetCurrency;

    // Calculate total budget (as string to avoid precision issues)
    const opex = parseFloat(finalOpex || '0');
    const capex = parseFloat(finalCapex || '0');
    const totalBudget = (opex + capex).toFixed(2);

    // Derive cost T-shirt if we have budget values
    let costTshirt = null;
    if (finalBudgetCurrency && (opex > 0 || capex > 0)) {
      costTshirt = await deriveCostTshirt(db, totalBudget, finalBudgetCurrency);
    }

    // Build update object
    const updateData: any = {
      version: sql`${projects.version} + 1`,
      updatedAt: new Date(),
    };

    if (opexBudget !== undefined) updateData.opexBudget = opexBudget;
    if (capexBudget !== undefined) updateData.capexBudget = capexBudget;
    if (budgetCurrency !== undefined) updateData.budgetCurrency = budgetCurrency;
    if (reportCurrency !== undefined) updateData.reportCurrency = reportCurrency;
    if (costTshirt !== null) updateData.costTshirt = costTshirt;

    // Update project with new budget and cost T-shirt
    const [updated] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, projectId))
      .returning({
        id: projects.id,
        opexBudget: projects.opexBudget,
        capexBudget: projects.capexBudget,
        budgetCurrency: projects.budgetCurrency,
        reportCurrency: projects.reportCurrency,
        costTshirt: projects.costTshirt,
        version: projects.version,
      });

    return {
      ...updated,
      totalBudget,
    };
  });

  // GET /api/projects/:projectId/budget/allocations
  // Lists all budget line allocations for a project
  fastify.get<{ Params: { projectId: string } }>(
    '/:projectId/budget/allocations',
    async (request, reply) => {
      const projectId = parseInt(request.params.projectId);

      // Verify project exists
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.id, projectId));

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      const allocations = await db
        .select({
          id: projectBudgetAllocations.id,
          budgetLineId: projectBudgetAllocations.budgetLineId,
          allocationAmount: projectBudgetAllocations.allocationAmount,
          lineValue: budgetLines.lineValue,
          company: budgetLines.company,
          lineAmount: budgetLines.lineAmount,
          currency: budgetLines.currency,
          type: budgetLines.type,
          fiscalYear: budgetLines.fiscalYear,
          departmentName: departments.name,
          costCenterCode: costCenters.code,
        })
        .from(projectBudgetAllocations)
        .innerJoin(
          budgetLines,
          eq(projectBudgetAllocations.budgetLineId, budgetLines.id)
        )
        .leftJoin(departments, eq(budgetLines.departmentId, departments.id))
        .leftJoin(costCenters, eq(budgetLines.costCenterId, costCenters.id))
        .where(eq(projectBudgetAllocations.projectId, projectId));

      return allocations;
    }
  );

  // POST /api/projects/:projectId/budget/allocations
  // Creates a new budget line allocation with validation
  fastify.post<{
    Params: { projectId: string };
    Body: {
      budgetLineId: number;
      allocationAmount: string;
    };
  }>('/:projectId/budget/allocations', async (request, reply) => {
    const projectId = parseInt(request.params.projectId);
    const { budgetLineId, allocationAmount } = request.body;

    // Use transaction with SERIALIZABLE isolation for concurrent safety
    try {
      const result = await db.transaction(
        async (tx) => {
          // Verify project exists
          const [project] = await tx
            .select({ id: projects.id })
            .from(projects)
            .where(eq(projects.id, projectId));

          if (!project) {
            throw new Error('Project not found');
          }

          // Get budget line with row lock (SELECT FOR UPDATE)
          const budgetLineResult = await tx.execute(
            sql`SELECT id, line_amount, currency FROM budget_lines WHERE id = ${budgetLineId} FOR UPDATE`
          );

          if (!budgetLineResult.rows || budgetLineResult.rows.length === 0) {
            throw new Error('Budget line not found');
          }

          const budgetLine = budgetLineResult.rows[0];

          // Calculate current total allocated for this budget line
          const currentAllocationsResult = await tx.execute(
            sql`SELECT COALESCE(SUM(allocation_amount), 0) as total_allocated
                FROM project_budget_allocations
                WHERE budget_line_id = ${budgetLineId}`
          );

          const currentAllocations = currentAllocationsResult.rows?.[0];
          const totalAllocated = parseFloat(
            (currentAllocations as any).total_allocated || '0'
          );
          const lineAmount = parseFloat((budgetLine as any).line_amount);
          const requestedAmount = parseFloat(allocationAmount);
          const available = lineAmount - totalAllocated;

          // Check if new allocation would exceed available
          if (requestedAmount > available) {
            throw new Error(
              JSON.stringify({
                error: 'Exceeds available',
                available: available.toFixed(2),
                requested: requestedAmount.toFixed(2),
                lineAmount: lineAmount.toFixed(2),
                currentAllocated: totalAllocated.toFixed(2),
              })
            );
          }

          // Insert allocation
          const [created] = await tx
            .insert(projectBudgetAllocations)
            .values({
              projectId,
              budgetLineId,
              allocationAmount,
            })
            .returning();

          return created;
        },
        {
          isolationLevel: 'serializable',
        }
      );

      // Get full allocation details with budget line info
      const [allocation] = await db
        .select({
          id: projectBudgetAllocations.id,
          budgetLineId: projectBudgetAllocations.budgetLineId,
          allocationAmount: projectBudgetAllocations.allocationAmount,
          lineValue: budgetLines.lineValue,
          company: budgetLines.company,
          lineAmount: budgetLines.lineAmount,
          currency: budgetLines.currency,
          type: budgetLines.type,
          fiscalYear: budgetLines.fiscalYear,
          departmentName: departments.name,
          costCenterCode: costCenters.code,
        })
        .from(projectBudgetAllocations)
        .innerJoin(
          budgetLines,
          eq(projectBudgetAllocations.budgetLineId, budgetLines.id)
        )
        .leftJoin(departments, eq(budgetLines.departmentId, departments.id))
        .leftJoin(costCenters, eq(budgetLines.costCenterId, costCenters.id))
        .where(eq(projectBudgetAllocations.id, result.id));

      return reply.code(201).send(allocation);
    } catch (error: any) {
      // Handle validation errors
      if (error.message?.includes('Exceeds available')) {
        const details = JSON.parse(error.message);
        return reply.code(400).send(details);
      }
      if (error.message === 'Project not found') {
        return reply.code(404).send({ error: 'Project not found' });
      }
      if (error.message === 'Budget line not found') {
        return reply.code(404).send({ error: 'Budget line not found' });
      }
      throw error;
    }
  });

  // PUT /api/projects/:projectId/budget/allocations/:budgetLineId
  // Updates an existing allocation with validation
  fastify.put<{
    Params: { projectId: string; budgetLineId: string };
    Body: {
      allocationAmount: string;
    };
  }>('/:projectId/budget/allocations/:budgetLineId', async (request, reply) => {
    const projectId = parseInt(request.params.projectId);
    const budgetLineId = parseInt(request.params.budgetLineId);
    const { allocationAmount } = request.body;

    // Use transaction with SERIALIZABLE isolation for concurrent safety
    try {
      const result = await db.transaction(
        async (tx) => {
          // Verify allocation exists
          const [existing] = await tx
            .select({ id: projectBudgetAllocations.id })
            .from(projectBudgetAllocations)
            .where(
              and(
                eq(projectBudgetAllocations.projectId, projectId),
                eq(projectBudgetAllocations.budgetLineId, budgetLineId)
              )
            );

          if (!existing) {
            throw new Error('Allocation not found');
          }

          // Get budget line with row lock (SELECT FOR UPDATE)
          const budgetLineResult = await tx.execute(
            sql`SELECT id, line_amount, currency FROM budget_lines WHERE id = ${budgetLineId} FOR UPDATE`
          );

          if (!budgetLineResult.rows || budgetLineResult.rows.length === 0) {
            throw new Error('Budget line not found');
          }

          const budgetLine = budgetLineResult.rows[0];

          // Calculate current total allocated for this budget line (excluding this allocation)
          const currentAllocationsResult = await tx.execute(
            sql`SELECT COALESCE(SUM(allocation_amount), 0) as total_allocated
                FROM project_budget_allocations
                WHERE budget_line_id = ${budgetLineId}
                AND id != ${existing.id}`
          );

          const currentAllocations = currentAllocationsResult.rows?.[0];
          const totalAllocated = parseFloat(
            (currentAllocations as any).total_allocated || '0'
          );
          const lineAmount = parseFloat((budgetLine as any).line_amount);
          const requestedAmount = parseFloat(allocationAmount);
          const available = lineAmount - totalAllocated;

          // Check if updated allocation would exceed available
          if (requestedAmount > available) {
            throw new Error(
              JSON.stringify({
                error: 'Exceeds available',
                available: available.toFixed(2),
                requested: requestedAmount.toFixed(2),
                lineAmount: lineAmount.toFixed(2),
                currentAllocated: totalAllocated.toFixed(2),
              })
            );
          }

          // Update allocation
          const [updated] = await tx
            .update(projectBudgetAllocations)
            .set({
              allocationAmount,
              updatedAt: new Date(),
            })
            .where(eq(projectBudgetAllocations.id, existing.id))
            .returning();

          return updated;
        },
        {
          isolationLevel: 'serializable',
        }
      );

      // Get full allocation details with budget line info
      const [allocation] = await db
        .select({
          id: projectBudgetAllocations.id,
          budgetLineId: projectBudgetAllocations.budgetLineId,
          allocationAmount: projectBudgetAllocations.allocationAmount,
          lineValue: budgetLines.lineValue,
          company: budgetLines.company,
          lineAmount: budgetLines.lineAmount,
          currency: budgetLines.currency,
          type: budgetLines.type,
          fiscalYear: budgetLines.fiscalYear,
          departmentName: departments.name,
          costCenterCode: costCenters.code,
        })
        .from(projectBudgetAllocations)
        .innerJoin(
          budgetLines,
          eq(projectBudgetAllocations.budgetLineId, budgetLines.id)
        )
        .leftJoin(departments, eq(budgetLines.departmentId, departments.id))
        .leftJoin(costCenters, eq(budgetLines.costCenterId, costCenters.id))
        .where(eq(projectBudgetAllocations.id, result.id));

      return allocation;
    } catch (error: any) {
      // Handle validation errors
      if (error.message?.includes('Exceeds available')) {
        const details = JSON.parse(error.message);
        return reply.code(400).send(details);
      }
      if (error.message === 'Allocation not found') {
        return reply.code(404).send({ error: 'Allocation not found' });
      }
      if (error.message === 'Budget line not found') {
        return reply.code(404).send({ error: 'Budget line not found' });
      }
      throw error;
    }
  });

  // DELETE /api/projects/:projectId/budget/allocations/:budgetLineId
  // Removes a budget line allocation (no validation needed)
  fastify.delete<{
    Params: { projectId: string; budgetLineId: string };
  }>('/:projectId/budget/allocations/:budgetLineId', async (request, reply) => {
    const projectId = parseInt(request.params.projectId);
    const budgetLineId = parseInt(request.params.budgetLineId);

    // Delete the allocation
    const [deleted] = await db
      .delete(projectBudgetAllocations)
      .where(
        and(
          eq(projectBudgetAllocations.projectId, projectId),
          eq(projectBudgetAllocations.budgetLineId, budgetLineId)
        )
      )
      .returning();

    if (!deleted) {
      return reply.code(404).send({ error: 'Allocation not found' });
    }

    return { success: true };
  });
}
