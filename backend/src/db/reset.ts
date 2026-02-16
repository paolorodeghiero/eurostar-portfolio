import 'dotenv/config';
import { db, pool } from './index.js';
import { sql } from 'drizzle-orm';
import { runStartupInit } from './init.js';

async function reset() {
  console.log('Truncating all tables...');
  await db.execute(sql.raw(`
    TRUNCATE
      departments, teams, statuses, outcomes, cost_centers,
      currency_rates, committee_levels, committee_thresholds,
      cost_tshirt_thresholds, competence_month_patterns,
      project_id_counters, projects, project_teams, project_values,
      project_change_impact, budget_lines, project_budget_allocations,
      receipts, invoices, audit_log, alert_config
    CASCADE
  `));
  console.log('All tables truncated.\n');

  // Run startup initialization to seed essential data
  console.log('Seeding essential data...');
  await runStartupInit();

  console.log('\n✅ Database reset complete.');
  await pool.end();
}

reset().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
