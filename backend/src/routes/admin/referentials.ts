import type { FastifyInstance } from 'fastify';
import { count } from 'drizzle-orm';
import { requireAdmin } from '../../middleware/require-admin.js';
import { departmentsRoutes } from './departments.js';
import { teamsRoutes } from './teams.js';
import { statusesRoutes } from './statuses.js';
import { outcomesRoutes } from './outcomes.js';
import { costCentersRoutes } from './cost-centers.js';
import { currencyRatesRoutes } from './currency-rates.js';
import { committeeLevelsRoutes } from './committee-levels.js';
import { committeeThresholdsRoutes } from './committee-thresholds.js';
import { costTshirtThresholdsRoutes } from './cost-tshirt-thresholds.js';
import { competenceMonthPatternsRoutes } from './competence-month-patterns.js';
import { budgetLinesRoutes } from './budget-lines.js';
import { auditLogRoutes } from './audit-log.js';
import {
  departments,
  teams,
  statuses,
  outcomes,
  costCenters,
  currencyRates,
  committeeLevels,
  committeeThresholds,
  costTshirtThresholds,
  competenceMonthPatterns,
} from '../../db/schema.js';

export async function referentialsRoutes(fastify: FastifyInstance) {
  // All admin routes require admin role
  fastify.addHook('preHandler', requireAdmin);

  // List all referential types
  fastify.get('/', async () => {
    return {
      types: [
        { id: 'departments', name: 'Departments', endpoint: '/api/admin/departments' },
        { id: 'teams', name: 'Teams', endpoint: '/api/admin/teams' },
        { id: 'statuses', name: 'Statuses', endpoint: '/api/admin/statuses' },
        { id: 'outcomes', name: 'Outcomes', endpoint: '/api/admin/outcomes' },
        { id: 'cost-centers', name: 'Cost Centers', endpoint: '/api/admin/cost-centers' },
        { id: 'currency-rates', name: 'Currency Rates', endpoint: '/api/admin/currency-rates' },
        { id: 'committee-levels', name: 'Committee Levels', endpoint: '/api/admin/committee-levels' },
        { id: 'committee-thresholds', name: 'Committee Thresholds', endpoint: '/api/admin/committee-thresholds' },
        { id: 'cost-tshirt-thresholds', name: 'Cost T-shirt Thresholds', endpoint: '/api/admin/cost-tshirt-thresholds' },
        { id: 'competence-month-patterns', name: 'Competence Month Patterns', endpoint: '/api/admin/competence-month-patterns' },
      ],
    };
  });

  // Get stats for all referential types
  fastify.get('/stats', async () => {
    const db = fastify.db;

    // Fetch all counts in parallel
    const [
      departmentsResult,
      teamsResult,
      statusesResult,
      outcomesResult,
      costCentersResult,
      currencyRatesResult,
      committeeLevelsResult,
      committeeThresholdsResult,
      costTshirtThresholdsResult,
      competenceMonthPatternsResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(departments),
      db.select({ count: count() }).from(teams),
      db.select({ count: count() }).from(statuses),
      db.select({ count: count() }).from(outcomes),
      db.select({ count: count() }).from(costCenters),
      db.select({ count: count() }).from(currencyRates),
      db.select({ count: count() }).from(committeeLevels),
      db.select({ count: count() }).from(committeeThresholds),
      db.select({ count: count() }).from(costTshirtThresholds),
      db.select({ count: count() }).from(competenceMonthPatterns),
    ]);

    return {
      departments: departmentsResult[0].count,
      teams: teamsResult[0].count,
      statuses: statusesResult[0].count,
      outcomes: outcomesResult[0].count,
      costCenters: costCentersResult[0].count,
      currencyRates: currencyRatesResult[0].count,
      committeeLevels: committeeLevelsResult[0].count,
      committeeThresholds: committeeThresholdsResult[0].count,
      costTshirtThresholds: costTshirtThresholdsResult[0].count,
      competenceMonthPatterns: competenceMonthPatternsResult[0].count,
    };
  });

  // Register individual referential routes
  await fastify.register(departmentsRoutes, { prefix: '/departments' });
  await fastify.register(teamsRoutes, { prefix: '/teams' });
  await fastify.register(statusesRoutes, { prefix: '/statuses' });
  await fastify.register(outcomesRoutes, { prefix: '/outcomes' });
  await fastify.register(costCentersRoutes, { prefix: '/cost-centers' });
  await fastify.register(currencyRatesRoutes, { prefix: '/currency-rates' });
  await fastify.register(committeeLevelsRoutes, { prefix: '/committee-levels' });
  await fastify.register(committeeThresholdsRoutes, { prefix: '/committee-thresholds' });
  await fastify.register(costTshirtThresholdsRoutes, { prefix: '/cost-tshirt-thresholds' });
  await fastify.register(competenceMonthPatternsRoutes, { prefix: '/competence-month-patterns' });
  await fastify.register(budgetLinesRoutes, { prefix: '/budget-lines' });
  await fastify.register(auditLogRoutes, { prefix: '/audit-log' });
}
