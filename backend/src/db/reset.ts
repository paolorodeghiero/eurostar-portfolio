import 'dotenv/config';
import { execSync } from 'child_process';
import { sql } from 'drizzle-orm';
import { db, pool } from './index.js';

// All reporting views to drop (in the reporting schema)
const REPORTING_VIEWS = [
  'fact_invoices',
  'fact_receipts',
  'fact_projects',
  'dim_date',
  'dim_competence_month_patterns',
  'dim_cost_tshirt_thresholds',
  'dim_committee_thresholds',
  'dim_committee_levels',
  'dim_currency_rates',
  'dim_cost_centers',
  'dim_outcomes',
  'dim_statuses',
  'dim_teams',
  'dim_departments',
];

async function reset() {
  // Step 1: Drop reporting views
  console.log('Dropping reporting views...');
  for (const view of REPORTING_VIEWS) {
    await db.execute(sql.raw(`DROP VIEW IF EXISTS reporting.${view} CASCADE`));
  }
  console.log('Reporting views dropped.\n');

  // Step 2: Truncate all tables
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

  // Close pool before running drizzle-kit
  await pool.end();

  // Step 3: Push schema changes
  console.log('Pushing schema changes...');
  execSync('npx drizzle-kit push', { stdio: 'inherit' });
  console.log('');

  // Step 4: Seed essential data (run as separate process to get fresh db connection)
  console.log('Seeding essential data...');
  execSync('npx tsx src/db/seed-runner.ts', { stdio: 'inherit' });

  console.log('\n✅ Database reset complete.');
}

reset().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
