import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Creates/updates all reporting views in the 'reporting' schema.
 * Called on app startup to ensure views stay in sync with schema changes.
 * Uses CREATE OR REPLACE VIEW for idempotency.
 */
export async function createReportingViews(db: NodePgDatabase<any>): Promise<void> {
  // Create reporting schema
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS reporting`);

  // Dimension views - Referential types (9 tables)

  await db.execute(sql`
    CREATE OR REPLACE VIEW reporting.dim_departments AS
    SELECT
      id AS department_key,
      name AS department_name,
      created_at,
      updated_at
    FROM departments
  `);

  await db.execute(sql`
    CREATE OR REPLACE VIEW reporting.dim_teams AS
    SELECT
      t.id AS team_key,
      t.name AS team_name,
      t.department_id AS department_key,
      d.name AS department_name,
      t.created_at,
      t.updated_at
    FROM teams t
    LEFT JOIN departments d ON t.department_id = d.id
  `);

  await db.execute(sql`
    CREATE OR REPLACE VIEW reporting.dim_statuses AS
    SELECT
      id AS status_key,
      name AS status_name,
      color,
      display_order,
      is_system_status,
      is_read_only
    FROM statuses
  `);

  await db.execute(sql`
    CREATE OR REPLACE VIEW reporting.dim_outcomes AS
    SELECT
      id AS outcome_key,
      name AS outcome_name,
      score_1_example,
      score_2_example,
      score_3_example,
      score_4_example,
      score_5_example
    FROM outcomes
  `);

  await db.execute(sql`
    CREATE OR REPLACE VIEW reporting.dim_cost_centers AS
    SELECT
      id AS cost_center_key,
      code,
      description
    FROM cost_centers
  `);

  await db.execute(sql`
    CREATE OR REPLACE VIEW reporting.dim_currency_rates AS
    SELECT
      id AS rate_key,
      from_currency,
      to_currency,
      rate,
      valid_from,
      valid_to
    FROM currency_rates
  `);

  await db.execute(sql`
    CREATE OR REPLACE VIEW reporting.dim_committee_levels AS
    SELECT
      id AS level_key,
      name AS level_name,
      mandatory,
      display_order
    FROM committee_levels
  `);

  await db.execute(sql`
    CREATE OR REPLACE VIEW reporting.dim_committee_thresholds AS
    SELECT
      ct.id AS threshold_key,
      ct.level_id AS level_key,
      cl.name AS level_name,
      cl.mandatory,
      ct.max_amount
    FROM committee_thresholds ct
    LEFT JOIN committee_levels cl ON ct.level_id = cl.id
  `);

  await db.execute(sql`
    CREATE OR REPLACE VIEW reporting.dim_cost_tshirt_thresholds AS
    SELECT
      id AS threshold_key,
      size,
      max_amount,
      currency
    FROM cost_tshirt_thresholds
  `);

  await db.execute(sql`
    CREATE OR REPLACE VIEW reporting.dim_competence_month_patterns AS
    SELECT
      id AS pattern_key,
      company,
      pattern,
      description
    FROM competence_month_patterns
  `);

  // Time dimension view
  await db.execute(sql`
    CREATE OR REPLACE VIEW reporting.dim_date AS
    SELECT
      d AS date_key,
      EXTRACT(YEAR FROM d)::INTEGER AS year,
      EXTRACT(QUARTER FROM d)::INTEGER AS quarter,
      EXTRACT(MONTH FROM d)::INTEGER AS month,
      EXTRACT(DAY FROM d)::INTEGER AS day,
      TO_CHAR(d, 'Month') AS month_name,
      TO_CHAR(d, 'Day') AS day_name
    FROM generate_series(
      '2020-01-01'::DATE,
      '2030-12-31'::DATE,
      '1 day'::INTERVAL
    ) AS d
  `);

  // Fact views

  // fact_projects - Project summary with calculated metrics
  await db.execute(sql`
    CREATE OR REPLACE VIEW reporting.fact_projects AS
    SELECT
      p.id AS project_key,
      p.project_id,
      p.name AS project_name,
      p.status_id AS status_key,
      p.lead_team_id AS lead_team_key,
      p.start_date,
      p.end_date,
      EXTRACT(YEAR FROM p.start_date)::INTEGER AS start_year,
      EXTRACT(QUARTER FROM p.start_date)::INTEGER AS start_quarter,
      EXTRACT(MONTH FROM p.start_date)::INTEGER AS start_month,
      p.opex_budget AS opex_budget_eur,
      p.capex_budget AS capex_budget_eur,
      COALESCE(p.opex_budget, 0) + COALESCE(p.capex_budget, 0) AS total_budget_eur,
      COALESCE(actuals.total_eur, 0) AS actuals_total_eur,
      (COALESCE(p.opex_budget, 0) + COALESCE(p.capex_budget, 0)) - COALESCE(actuals.total_eur, 0) AS budget_remaining_eur,
      CASE
        WHEN (COALESCE(p.opex_budget, 0) + COALESCE(p.capex_budget, 0)) > 0
        THEN (COALESCE(actuals.total_eur, 0) / (COALESCE(p.opex_budget, 0) + COALESCE(p.capex_budget, 0))) * 100
        ELSE NULL
      END AS percent_used,
      CASE
        WHEN p.end_date IS NOT NULL AND p.end_date >= CURRENT_DATE
        THEN p.end_date - CURRENT_DATE
        ELSE NULL
      END AS days_until_end,
      p.committee_state,
      p.committee_level,
      p.cost_tshirt,
      s.is_read_only,
      p.created_at,
      p.updated_at
    FROM projects p
    LEFT JOIN statuses s ON p.status_id = s.id
    LEFT JOIN (
      SELECT
        project_id,
        SUM(
          CASE
            WHEN cr.rate IS NOT NULL THEN r.amount * cr.rate
            ELSE NULL
          END
        ) AS total_eur
      FROM receipts r
      LEFT JOIN currency_rates cr
        ON cr.from_currency = r.currency
        AND cr.to_currency = 'EUR'
        AND cr.valid_from <= r.receipt_date
        AND (cr.valid_to IS NULL OR cr.valid_to >= r.receipt_date)
      GROUP BY project_id
    ) actuals ON p.id = actuals.project_id
  `);

  // fact_receipts - Receipt actuals with currency conversion
  await db.execute(sql`
    CREATE OR REPLACE VIEW reporting.fact_receipts AS
    SELECT
      r.id AS receipt_key,
      r.project_id AS project_key,
      p.project_id,
      r.receipt_number,
      r.company,
      r.purchase_order,
      r.amount AS amount_original,
      r.currency AS original_currency,
      CASE
        WHEN cr.rate IS NOT NULL THEN r.amount * cr.rate
        ELSE NULL
      END AS amount_eur,
      r.receipt_date,
      EXTRACT(YEAR FROM r.receipt_date)::INTEGER AS receipt_year,
      EXTRACT(QUARTER FROM r.receipt_date)::INTEGER AS receipt_quarter,
      EXTRACT(MONTH FROM r.receipt_date)::INTEGER AS receipt_month,
      r.created_at
    FROM receipts r
    LEFT JOIN projects p ON r.project_id = p.id
    LEFT JOIN currency_rates cr
      ON cr.from_currency = r.currency
      AND cr.to_currency = 'EUR'
      AND cr.valid_from <= r.receipt_date
      AND (cr.valid_to IS NULL OR cr.valid_to >= r.receipt_date)
  `);

  // fact_invoices - Invoice actuals with currency conversion
  await db.execute(sql`
    CREATE OR REPLACE VIEW reporting.fact_invoices AS
    SELECT
      i.id AS invoice_key,
      i.project_id AS project_key,
      p.project_id,
      i.invoice_number,
      i.company,
      i.purchase_order,
      i.amount AS amount_original,
      i.currency AS original_currency,
      CASE
        WHEN cr.rate IS NOT NULL THEN i.amount * cr.rate
        ELSE NULL
      END AS amount_eur,
      i.invoice_date,
      EXTRACT(YEAR FROM i.invoice_date)::INTEGER AS invoice_year,
      EXTRACT(QUARTER FROM i.invoice_date)::INTEGER AS invoice_quarter,
      EXTRACT(MONTH FROM i.invoice_date)::INTEGER AS invoice_month,
      COALESCE(i.competence_month_override, i.competence_month) AS competence_month,
      i.competence_month_extracted,
      i.created_at
    FROM invoices i
    LEFT JOIN projects p ON i.project_id = p.id
    LEFT JOIN currency_rates cr
      ON cr.from_currency = i.currency
      AND cr.to_currency = 'EUR'
      AND cr.valid_from <= i.invoice_date
      AND (cr.valid_to IS NULL OR cr.valid_to >= i.invoice_date)
  `);
}
