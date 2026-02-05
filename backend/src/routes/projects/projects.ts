import type { FastifyInstance } from 'fastify';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  projects,
  projectTeams,
  projectValues,
  projectChangeImpact,
  teams,
  statuses,
  outcomes,
  departments,
  receipts,
  invoices,
} from '../../db/schema.js';
import { generateProjectId } from '../../lib/project-id-generator.js';
import { convertCurrency } from '../../lib/currency-converter.js';

export async function projectRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // POST /api/projects - Create project
  fastify.post<{
    Body: {
      name: string;
      leadTeamId: number;
      startDate?: string;
      endDate?: string;
    };
  }>('/', async (request, reply) => {
    const { name, leadTeamId, startDate, endDate } = request.body;

    // Validation
    if (!name?.trim()) {
      return reply.code(400).send({ error: 'Name is required' });
    }
    if (!leadTeamId) {
      return reply.code(400).send({ error: 'Lead team ID is required' });
    }

    // Verify lead team exists
    const [leadTeam] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, leadTeamId));
    if (!leadTeam) {
      return reply.code(400).send({ error: 'Lead team not found' });
    }

    // Generate unique project ID
    const projectId = await generateProjectId();

    // Get user email from request (or dev-user in dev mode)
    const userEmail = request.user?.email || 'dev-user';

    // Create project
    const [project] = await db
      .insert(projects)
      .values({
        projectId,
        name: name.trim(),
        leadTeamId,
        startDate: startDate || null,
        endDate: endDate || null,
        createdBy: userEmail,
        updatedBy: userEmail,
      })
      .returning();

    // Auto-create lead team entry in project_teams
    await db.insert(projectTeams).values({
      projectId: project.id,
      teamId: leadTeamId,
      effortSize: 'M', // Default size
      isLead: true,
    });

    return reply.code(201).send({
      ...project,
      leadTeam: {
        id: leadTeam.id,
        name: leadTeam.name,
      },
    });
  });

  // GET /api/projects - List all projects
  fastify.get<{
    Querystring: { stopped?: string };
  }>('/', async (request) => {
    const stoppedFilter = request.query.stopped;

    // Build base query
    let query = db
      .select({
        id: projects.id,
        projectId: projects.projectId,
        name: projects.name,
        statusId: projects.statusId,
        statusName: statuses.name,
        statusColor: statuses.color,
        startDate: projects.startDate,
        endDate: projects.endDate,
        leadTeamId: projects.leadTeamId,
        leadTeamName: teams.name,
        projectManager: projects.projectManager,
        isOwner: projects.isOwner,
        sponsor: projects.sponsor,
        isStopped: projects.isStopped,
        version: projects.version,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        createdBy: projects.createdBy,
        updatedBy: projects.updatedBy,
      })
      .from(projects)
      .leftJoin(teams, eq(projects.leadTeamId, teams.id))
      .leftJoin(statuses, eq(projects.statusId, statuses.id))
      .orderBy(desc(projects.createdAt));

    // Apply stopped filter if provided
    if (stoppedFilter !== undefined) {
      const isStopped = stoppedFilter === 'true';
      query = query.where(eq(projects.isStopped, isStopped)) as typeof query;
    }

    const projectsList = await query;

    return projectsList.map((p) => ({
      ...p,
      status: p.statusId
        ? { id: p.statusId, name: p.statusName, color: p.statusColor }
        : null,
      leadTeam: { id: p.leadTeamId, name: p.leadTeamName },
    }));
  });

  // GET /api/projects/:id - Get single project with all nested data
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);

    // Get project with status and lead team
    const [project] = await db
      .select({
        id: projects.id,
        projectId: projects.projectId,
        name: projects.name,
        statusId: projects.statusId,
        statusName: statuses.name,
        statusColor: statuses.color,
        startDate: projects.startDate,
        endDate: projects.endDate,
        leadTeamId: projects.leadTeamId,
        leadTeamName: teams.name,
        leadTeamDepartmentId: teams.departmentId,
        projectManager: projects.projectManager,
        isOwner: projects.isOwner,
        sponsor: projects.sponsor,
        isStopped: projects.isStopped,
        opexBudget: projects.opexBudget,
        capexBudget: projects.capexBudget,
        budgetCurrency: projects.budgetCurrency,
        reportCurrency: projects.reportCurrency,
        costTshirt: projects.costTshirt,
        version: projects.version,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        createdBy: projects.createdBy,
        updatedBy: projects.updatedBy,
      })
      .from(projects)
      .leftJoin(teams, eq(projects.leadTeamId, teams.id))
      .leftJoin(statuses, eq(projects.statusId, statuses.id))
      .where(eq(projects.id, id));

    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    // Get all project teams with team names
    const projectTeamsList = await db
      .select({
        id: projectTeams.id,
        teamId: projectTeams.teamId,
        teamName: teams.name,
        departmentId: teams.departmentId,
        departmentName: departments.name,
        effortSize: projectTeams.effortSize,
        isLead: projectTeams.isLead,
      })
      .from(projectTeams)
      .leftJoin(teams, eq(projectTeams.teamId, teams.id))
      .leftJoin(departments, eq(teams.departmentId, departments.id))
      .where(eq(projectTeams.projectId, id));

    // Get all project values with outcome names
    const projectValuesList = await db
      .select({
        id: projectValues.id,
        outcomeId: projectValues.outcomeId,
        outcomeName: outcomes.name,
        score: projectValues.score,
        justification: projectValues.justification,
        score1Example: outcomes.score1Example,
        score2Example: outcomes.score2Example,
        score3Example: outcomes.score3Example,
        score4Example: outcomes.score4Example,
        score5Example: outcomes.score5Example,
      })
      .from(projectValues)
      .leftJoin(outcomes, eq(projectValues.outcomeId, outcomes.id))
      .where(eq(projectValues.projectId, id));

    // Get all change impact teams
    const changeImpactList = await db
      .select({
        id: projectChangeImpact.id,
        teamId: projectChangeImpact.teamId,
        teamName: teams.name,
        departmentId: teams.departmentId,
        departmentName: departments.name,
        impactSize: projectChangeImpact.impactSize,
      })
      .from(projectChangeImpact)
      .leftJoin(teams, eq(projectChangeImpact.teamId, teams.id))
      .leftJoin(departments, eq(teams.departmentId, departments.id))
      .where(eq(projectChangeImpact.projectId, id));

    return {
      id: project.id,
      projectId: project.projectId,
      name: project.name,
      status: project.statusId
        ? { id: project.statusId, name: project.statusName, color: project.statusColor }
        : null,
      startDate: project.startDate,
      endDate: project.endDate,
      leadTeam: {
        id: project.leadTeamId,
        name: project.leadTeamName,
        departmentId: project.leadTeamDepartmentId,
      },
      projectManager: project.projectManager,
      isOwner: project.isOwner,
      sponsor: project.sponsor,
      isStopped: project.isStopped,
      opexBudget: project.opexBudget,
      capexBudget: project.capexBudget,
      budgetCurrency: project.budgetCurrency,
      reportCurrency: project.reportCurrency,
      costTshirt: project.costTshirt,
      version: project.version,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      createdBy: project.createdBy,
      updatedBy: project.updatedBy,
      teams: projectTeamsList.map((t) => ({
        id: t.id,
        teamId: t.teamId,
        teamName: t.teamName,
        departmentId: t.departmentId,
        departmentName: t.departmentName,
        effortSize: t.effortSize,
        isLead: t.isLead,
      })),
      values: projectValuesList.map((v) => ({
        id: v.id,
        outcomeId: v.outcomeId,
        outcomeName: v.outcomeName,
        score: v.score,
        justification: v.justification,
        scoreExamples: {
          1: v.score1Example,
          2: v.score2Example,
          3: v.score3Example,
          4: v.score4Example,
          5: v.score5Example,
        },
      })),
      changeImpact: changeImpactList.map((c) => ({
        id: c.id,
        teamId: c.teamId,
        teamName: c.teamName,
        departmentId: c.departmentId,
        departmentName: c.departmentName,
        impactSize: c.impactSize,
      })),
    };
  });

  // PUT /api/projects/:id - Update project with optimistic locking
  fastify.put<{
    Params: { id: string };
    Body: {
      name?: string;
      statusId?: number | null;
      startDate?: string | null;
      endDate?: string | null;
      leadTeamId?: number;
      projectManager?: string | null;
      isOwner?: string | null;
      sponsor?: string | null;
      expectedVersion: number;
    };
  }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const { expectedVersion, ...updateData } = request.body;

    if (expectedVersion === undefined) {
      return reply.code(400).send({ error: 'expectedVersion is required for optimistic locking' });
    }

    // Get current project to check version and existence
    const [current] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));

    if (!current) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    // Check version for optimistic locking
    if (current.version !== expectedVersion) {
      return reply.code(409).send({
        error: 'Version conflict',
        message: 'The project has been modified by another user. Please refresh and try again.',
        currentVersion: current.version,
        expectedVersion,
        currentData: current,
      });
    }

    // Validate leadTeamId if provided
    if (updateData.leadTeamId) {
      const [leadTeam] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, updateData.leadTeamId));
      if (!leadTeam) {
        return reply.code(400).send({ error: 'Lead team not found' });
      }
    }

    // Validate statusId if provided
    if (updateData.statusId) {
      const [status] = await db
        .select()
        .from(statuses)
        .where(eq(statuses.id, updateData.statusId));
      if (!status) {
        return reply.code(400).send({ error: 'Status not found' });
      }
    }

    // Get user email
    const userEmail = request.user?.email || 'dev-user';

    // Build update object
    const updates: Partial<typeof projects.$inferInsert> = {
      updatedAt: new Date(),
      updatedBy: userEmail,
      version: current.version + 1,
    };

    if (updateData.name?.trim()) updates.name = updateData.name.trim();
    if (updateData.statusId !== undefined) updates.statusId = updateData.statusId;
    if (updateData.startDate !== undefined) updates.startDate = updateData.startDate;
    if (updateData.endDate !== undefined) updates.endDate = updateData.endDate;
    if (updateData.leadTeamId) updates.leadTeamId = updateData.leadTeamId;
    if (updateData.projectManager !== undefined) {
      updates.projectManager = updateData.projectManager?.trim() || null;
    }
    if (updateData.isOwner !== undefined) {
      updates.isOwner = updateData.isOwner?.trim() || null;
    }
    if (updateData.sponsor !== undefined) {
      updates.sponsor = updateData.sponsor?.trim() || null;
    }

    // Perform update with version check
    const [updated] = await db
      .update(projects)
      .set(updates)
      .where(and(eq(projects.id, id), eq(projects.version, expectedVersion)))
      .returning();

    if (!updated) {
      // Race condition - version changed between check and update
      const [freshData] = await db.select().from(projects).where(eq(projects.id, id));
      return reply.code(409).send({
        error: 'Version conflict',
        message: 'The project has been modified by another user. Please refresh and try again.',
        currentVersion: freshData?.version,
        expectedVersion,
        currentData: freshData,
      });
    }

    return updated;
  });

  // DELETE /api/projects/:id - Delete project (only if no actuals)
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);

    // Check if project exists
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));

    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    // Check for actuals (placeholder - actuals table doesn't exist yet)
    // TODO: Implement actual actuals check when actuals table is created
    const hasActuals = false;

    if (hasActuals) {
      return reply.code(400).send({
        error: 'Cannot delete project',
        message: 'Project has actuals recorded. Remove actuals first or stop the project instead.',
      });
    }

    // Delete project (cascades to project_teams, project_values, project_change_impact via FK)
    const [deleted] = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();

    return { success: true, deleted };
  });

  // PATCH /api/projects/:id/stop - Stop project
  fastify.patch<{ Params: { id: string } }>('/:id/stop', async (request, reply) => {
    const id = parseInt(request.params.id);
    const userEmail = request.user?.email || 'dev-user';

    // Get current project
    const [current] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));

    if (!current) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    if (current.isStopped) {
      return reply.code(400).send({ error: 'Project is already stopped' });
    }

    // Stop project and increment version
    const [updated] = await db
      .update(projects)
      .set({
        isStopped: true,
        version: current.version + 1,
        updatedAt: new Date(),
        updatedBy: userEmail,
      })
      .where(eq(projects.id, id))
      .returning();

    return updated;
  });

  // PATCH /api/projects/:id/reactivate - Reactivate stopped project
  fastify.patch<{ Params: { id: string } }>('/:id/reactivate', async (request, reply) => {
    const id = parseInt(request.params.id);
    const userEmail = request.user?.email || 'dev-user';

    // Get current project
    const [current] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));

    if (!current) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    if (!current.isStopped) {
      return reply.code(400).send({ error: 'Project is not stopped' });
    }

    // Reactivate project and increment version
    const [updated] = await db
      .update(projects)
      .set({
        isStopped: false,
        version: current.version + 1,
        updatedAt: new Date(),
        updatedBy: userEmail,
      })
      .where(eq(projects.id, id))
      .returning();

    return updated;
  });

  // GET /api/projects/people-suggestions - Get distinct people values for autocomplete
  fastify.get('/people-suggestions', async () => {
    // Get distinct project managers
    const pmResults = await db
      .selectDistinct({ value: projects.projectManager })
      .from(projects)
      .where(sql`${projects.projectManager} IS NOT NULL AND ${projects.projectManager} != ''`);

    // Get distinct IS owners
    const ownerResults = await db
      .selectDistinct({ value: projects.isOwner })
      .from(projects)
      .where(sql`${projects.isOwner} IS NOT NULL AND ${projects.isOwner} != ''`);

    // Get distinct sponsors
    const sponsorResults = await db
      .selectDistinct({ value: projects.sponsor })
      .from(projects)
      .where(sql`${projects.sponsor} IS NOT NULL AND ${projects.sponsor} != ''`);

    return {
      projectManagers: pmResults.map(r => r.value).filter(Boolean).sort(),
      isOwners: ownerResults.map(r => r.value).filter(Boolean).sort(),
      sponsors: sponsorResults.map(r => r.value).filter(Boolean).sort(),
    };
  });

  // GET /api/projects/:id/actuals/summary - Get actuals summary for a project
  fastify.get<{
    Params: { id: string };
    Querystring: { reportCurrency?: string };
  }>('/:id/actuals/summary', async (request, reply) => {
    const id = parseInt(request.params.id);
    const { reportCurrency } = request.query;

    // Get project with budget info and startDate for exchange rate lookup
    const [project] = await db
      .select({
        id: projects.id,
        opexBudget: projects.opexBudget,
        capexBudget: projects.capexBudget,
        budgetCurrency: projects.budgetCurrency,
        reportCurrency: projects.reportCurrency,
        startDate: projects.startDate,
      })
      .from(projects)
      .where(eq(projects.id, id));

    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    if (!project.budgetCurrency) {
      return reply.code(400).send({ error: 'Project has no budget set' });
    }

    // Determine target currency for display (query param > project reportCurrency > EUR default)
    const targetCurrency = reportCurrency || project.reportCurrency || 'EUR';
    // Project budget conversion uses project start date
    const projectStartDate = project.startDate ? new Date(project.startDate) : undefined;

    // Get all receipts with their currencies and dates for conversion
    const allReceipts = await db
      .select({
        amount: receipts.amount,
        currency: receipts.currency,
        receiptDate: receipts.receiptDate,
      })
      .from(receipts)
      .where(eq(receipts.projectId, id));

    // Convert and sum receipts - each receipt uses its own date for exchange rate
    let totalReceipts = 0;
    for (const receipt of allReceipts) {
      if (receipt.currency === targetCurrency) {
        totalReceipts += parseFloat(receipt.amount);
      } else {
        try {
          // Use receipt date for exchange rate lookup
          const receiptConversionDate = receipt.receiptDate ? new Date(receipt.receiptDate) : undefined;
          const converted = await convertCurrency(
            db,
            receipt.amount,
            receipt.currency,
            targetCurrency,
            receiptConversionDate
          );
          totalReceipts += parseFloat(converted);
        } catch (err) {
          // If conversion fails, use original amount
          console.error(`Failed to convert receipt from ${receipt.currency} to ${targetCurrency}:`, err);
          totalReceipts += parseFloat(receipt.amount);
        }
      }
    }

    // Calculate total invoices (not converted, just for info)
    const [invoicesTotal] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${invoices.amount}), 0)`,
      })
      .from(invoices)
      .where(eq(invoices.projectId, id));

    // Count invoices needing attention (competenceMonthExtracted = false)
    const [invoicesNeedingAttention] = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(invoices)
      .where(and(
        eq(invoices.projectId, id),
        eq(invoices.competenceMonthExtracted, false)
      ));

    // Convert budget totals to target currency
    // Project budget is always stored in EUR, convert using project start date
    let budgetTotal = 0;
    const opex = parseFloat(project.opexBudget || '0');
    const capex = parseFloat(project.capexBudget || '0');
    const rawBudget = opex + capex;
    const budgetSourceCurrency = 'EUR'; // Project budget is always stored in EUR

    if (budgetSourceCurrency === targetCurrency) {
      budgetTotal = rawBudget;
    } else {
      try {
        if (opex > 0) {
          const convertedOpex = await convertCurrency(
            db,
            project.opexBudget!,
            budgetSourceCurrency,
            targetCurrency,
            projectStartDate
          );
          budgetTotal += parseFloat(convertedOpex);
        }
        if (capex > 0) {
          const convertedCapex = await convertCurrency(
            db,
            project.capexBudget!,
            budgetSourceCurrency,
            targetCurrency,
            projectStartDate
          );
          budgetTotal += parseFloat(convertedCapex);
        }
      } catch (err) {
        console.error(`Failed to convert budget from ${budgetSourceCurrency} to ${targetCurrency}:`, err);
        budgetTotal = rawBudget; // Fall back to raw values
      }
    }

    const totalInvoices = parseFloat(invoicesTotal?.total || '0');
    const totalActuals = totalReceipts + totalInvoices;

    // Use receipts only for budget calculations (invoices tracked separately)
    const budgetRemaining = budgetTotal - totalReceipts;
    const percentUsed = budgetTotal > 0 ? (totalReceipts / budgetTotal) * 100 : 0;

    return {
      totalReceipts: totalReceipts.toFixed(2),
      totalInvoices: totalInvoices.toFixed(2),
      totalActuals: totalActuals.toFixed(2),
      currency: targetCurrency,
      budgetTotal: budgetTotal.toFixed(2),
      budgetRemaining: budgetRemaining.toFixed(2),
      percentUsed: percentUsed.toFixed(2),
      invoicesNeedingAttention: invoicesNeedingAttention?.count || 0,
    };
  });
}
