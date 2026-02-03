import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../../middleware/require-admin.js';
import { departmentsRoutes } from './departments.js';
import { teamsRoutes } from './teams.js';
import { statusesRoutes } from './statuses.js';
import { outcomesRoutes } from './outcomes.js';
import { costCentersRoutes } from './cost-centers.js';
import { currencyRatesRoutes } from './currency-rates.js';
import { committeeThresholdsRoutes } from './committee-thresholds.js';
import { costTshirtThresholdsRoutes } from './cost-tshirt-thresholds.js';
import { competenceMonthPatternsRoutes } from './competence-month-patterns.js';

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
        { id: 'committee-thresholds', name: 'Committee Thresholds', endpoint: '/api/admin/committee-thresholds' },
        { id: 'cost-tshirt-thresholds', name: 'Cost T-shirt Thresholds', endpoint: '/api/admin/cost-tshirt-thresholds' },
        { id: 'competence-month-patterns', name: 'Competence Month Patterns', endpoint: '/api/admin/competence-month-patterns' },
      ],
    };
  });

  // Register individual referential routes
  await fastify.register(departmentsRoutes, { prefix: '/departments' });
  await fastify.register(teamsRoutes, { prefix: '/teams' });
  await fastify.register(statusesRoutes, { prefix: '/statuses' });
  await fastify.register(outcomesRoutes, { prefix: '/outcomes' });
  await fastify.register(costCentersRoutes, { prefix: '/cost-centers' });
  await fastify.register(currencyRatesRoutes, { prefix: '/currency-rates' });
  await fastify.register(committeeThresholdsRoutes, { prefix: '/committee-thresholds' });
  await fastify.register(costTshirtThresholdsRoutes, { prefix: '/cost-tshirt-thresholds' });
  await fastify.register(competenceMonthPatternsRoutes, { prefix: '/competence-month-patterns' });
}
