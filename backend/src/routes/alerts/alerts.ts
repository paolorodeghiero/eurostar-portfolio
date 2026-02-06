import type { FastifyInstance } from 'fastify';
import { eq, and, sql, or } from 'drizzle-orm';
import {
  projects,
  statuses,
  alertConfig,
  receipts,
  invoices,
} from '../../db/schema.js';

interface Alert {
  id: number;
  projectId: string;
  projectName: string;
  type: 'overdue' | 'budget_limit';
  message: string;
  severity: 'warning' | 'critical';
  details: Record<string, unknown>;
}

export async function alertRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // GET /api/alerts - Get all active alerts
  fastify.get('/', async () => {
    const alerts: Alert[] = [];

    // Get alert configuration
    const configs = await db.select().from(alertConfig);
    const overdueConfig = configs.find(c => c.type === 'overdue');
    const budgetConfig = configs.find(c => c.type === 'budget_limit');

    // Get completed/closed status IDs to exclude
    const completedStatuses = await db
      .select({ id: statuses.id })
      .from(statuses)
      .where(sql`LOWER(${statuses.name}) IN ('completed', 'closed', 'cancelled')`);
    const completedStatusIds = completedStatuses.map(s => s.id);

    // 1. Overdue projects alert
    if (overdueConfig?.enabled !== false) {
      const overdueProjects = await db
        .select({
          id: projects.id,
          projectId: projects.projectId,
          name: projects.name,
          endDate: projects.endDate,
        })
        .from(projects)
        .where(
          and(
            sql`${projects.endDate} < CURRENT_DATE`,
            eq(projects.isStopped, false),
            completedStatusIds.length > 0
              ? sql`(${projects.statusId} IS NULL OR ${projects.statusId} NOT IN (${sql.join(completedStatusIds.map(id => sql`${id}`), sql`, `)}))`
              : sql`1=1`
          )
        );

      for (const project of overdueProjects) {
        const daysOverdue = Math.floor(
          (Date.now() - new Date(project.endDate!).getTime()) / (1000 * 60 * 60 * 24)
        );

        alerts.push({
          id: project.id,
          projectId: project.projectId,
          projectName: project.name,
          type: 'overdue',
          message: `Project is ${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue`,
          severity: daysOverdue > 30 ? 'critical' : 'warning',
          details: {
            endDate: project.endDate,
            daysOverdue,
          },
        });
      }
    }

    // 2. Budget limit alerts
    if (budgetConfig?.enabled !== false) {
      const thresholdPercent = budgetConfig?.budgetThresholdPercent || 90;
      const threshold = thresholdPercent / 100;

      // Get projects with budget set
      const projectsWithBudget = await db
        .select({
          id: projects.id,
          projectId: projects.projectId,
          name: projects.name,
          opexBudget: projects.opexBudget,
          capexBudget: projects.capexBudget,
          budgetCurrency: projects.budgetCurrency,
        })
        .from(projects)
        .where(
          and(
            eq(projects.isStopped, false),
            or(
              sql`${projects.opexBudget} IS NOT NULL AND ${projects.opexBudget} > 0`,
              sql`${projects.capexBudget} IS NOT NULL AND ${projects.capexBudget} > 0`
            )
          )
        );

      for (const project of projectsWithBudget) {
        const totalBudget =
          parseFloat(project.opexBudget || '0') +
          parseFloat(project.capexBudget || '0');

        if (totalBudget === 0) continue;

        // Get total receipts for this project
        const [receiptTotal] = await db
          .select({
            total: sql<string>`COALESCE(SUM(${receipts.amount}), 0)`,
          })
          .from(receipts)
          .where(eq(receipts.projectId, project.id));

        // Get total invoices for this project
        const [invoiceTotal] = await db
          .select({
            total: sql<string>`COALESCE(SUM(${invoices.amount}), 0)`,
          })
          .from(invoices)
          .where(eq(invoices.projectId, project.id));

        const totalSpent =
          parseFloat(receiptTotal?.total || '0') +
          parseFloat(invoiceTotal?.total || '0');

        const percentUsed = totalSpent / totalBudget;

        if (percentUsed >= threshold) {
          alerts.push({
            id: project.id,
            projectId: project.projectId,
            projectName: project.name,
            type: 'budget_limit',
            message: `Project has used ${Math.round(percentUsed * 100)}% of budget`,
            severity: percentUsed >= 1 ? 'critical' : 'warning',
            details: {
              totalBudget: totalBudget.toFixed(2),
              totalSpent: totalSpent.toFixed(2),
              percentUsed: (percentUsed * 100).toFixed(1),
              currency: project.budgetCurrency,
              thresholdPercent,
            },
          });
        }
      }
    }

    return {
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
    };
  });

  // GET /api/alerts/config - Get alert configuration
  fastify.get('/config', async () => {
    const configs = await db.select().from(alertConfig);
    return { configs };
  });

  // PUT /api/alerts/config/:type - Update alert configuration
  fastify.put<{
    Params: { type: string };
    Body: { enabled?: boolean; budgetThresholdPercent?: number };
  }>('/config/:type', async (request, reply) => {
    const { type } = request.params;
    const { enabled, budgetThresholdPercent } = request.body;

    if (!['overdue', 'budget_limit'].includes(type)) {
      return reply.code(400).send({ error: 'Invalid alert type' });
    }

    const [existing] = await db
      .select()
      .from(alertConfig)
      .where(eq(alertConfig.type, type));

    if (!existing) {
      return reply.code(404).send({ error: 'Alert config not found' });
    }

    const updates: Partial<typeof alertConfig.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (enabled !== undefined) updates.enabled = enabled;
    if (budgetThresholdPercent !== undefined) {
      if (budgetThresholdPercent < 1 || budgetThresholdPercent > 100) {
        return reply.code(400).send({ error: 'Threshold must be between 1 and 100' });
      }
      updates.budgetThresholdPercent = budgetThresholdPercent;
    }

    const [updated] = await db
      .update(alertConfig)
      .set(updates)
      .where(eq(alertConfig.type, type))
      .returning();

    return updated;
  });
}
