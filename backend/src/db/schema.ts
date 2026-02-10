import {
  pgTable,
  integer,
  varchar,
  text,
  timestamp,
  numeric,
  date,
  boolean,
  unique,
  jsonb,
} from 'drizzle-orm/pg-core';

// Departments table
export const departments = pgTable('departments', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Teams table
export const teams = pgTable('teams', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 500 }),
  departmentId: integer('department_id')
    .notNull()
    .references(() => departments.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Statuses table
export const statuses = pgTable('statuses', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  color: varchar('color', { length: 7 }).notNull(), // Hex color code
  displayOrder: integer('display_order').notNull(),
  isSystemStatus: boolean('is_system_status').notNull().default(false), // Draft/Stopped/Completed are system statuses
  isReadOnly: boolean('is_read_only').notNull().default(false), // Stopped/Completed make project read-only
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Outcomes table (for value scoring)
export const outcomes = pgTable('outcomes', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  score1Example: text('score_1_example'),
  score2Example: text('score_2_example'),
  score3Example: text('score_3_example'),
  score4Example: text('score_4_example'),
  score5Example: text('score_5_example'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Cost Centers table
export const costCenters = pgTable('cost_centers', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Currency Rates table
export const currencyRates = pgTable('currency_rates', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  fromCurrency: varchar('from_currency', { length: 3 }).notNull(),
  toCurrency: varchar('to_currency', { length: 3 }).notNull(),
  rate: numeric('rate', { precision: 10, scale: 6 }).notNull(),
  validFrom: date('valid_from').notNull(),
  validTo: date('valid_to'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Committee Thresholds table
export const committeeThresholds = pgTable('committee_thresholds', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  minAmount: numeric('min_amount', { precision: 15, scale: 2 }).notNull(),
  maxAmount: numeric('max_amount', { precision: 15, scale: 2 }),
  level: varchar('level', { length: 20 }).notNull(), // 'mandatory', 'optional', 'not_necessary'
  currency: varchar('currency', { length: 3 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Cost T-shirt Thresholds table
export const costTshirtThresholds = pgTable('cost_tshirt_thresholds', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  size: varchar('size', { length: 5 }).notNull(), // XS, S, M, L, XL, XXL
  maxAmount: numeric('max_amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Competence Month Patterns table
export const competenceMonthPatterns = pgTable('competence_month_patterns', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  company: varchar('company', { length: 10 }).notNull(), // THIF, EIL
  pattern: varchar('pattern', { length: 500 }).notNull(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Project ID Counters table - for PRJ-YYYY-INC generation
export const projectIdCounters = pgTable('project_id_counters', {
  year: integer('year').primaryKey(),
  lastId: integer('last_id').notNull().default(0),
});

// Projects table - Core project entity
export const projects = pgTable('projects', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  projectId: varchar('project_id', { length: 20 }).notNull().unique(), // PRJ-YYYY-00001 format
  name: varchar('name', { length: 255 }).notNull(),
  statusId: integer('status_id').references(() => statuses.id, { onDelete: 'restrict' }),
  startDate: date('start_date'),
  endDate: date('end_date'),
  leadTeamId: integer('lead_team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'restrict' }),
  projectManager: varchar('project_manager', { length: 255 }),
  isOwner: varchar('is_owner', { length: 255 }),
  sponsor: varchar('sponsor', { length: 255 }),
  description: text('description'),
  isStopped: boolean('is_stopped').notNull().default(false), // Deprecated - use status.isReadOnly instead
  previousStatusId: integer('previous_status_id').references(() => statuses.id, { onDelete: 'set null' }), // For stop/reactivate workflow
  opexBudget: numeric('opex_budget', { precision: 15, scale: 2 }),
  capexBudget: numeric('capex_budget', { precision: 15, scale: 2 }),
  budgetCurrency: varchar('budget_currency', { length: 3 }), // ISO 4217
  reportCurrency: varchar('report_currency', { length: 3 }), // ISO 4217 currency code for reporting display (GBP or EUR)
  costTshirt: varchar('cost_tshirt', { length: 5 }), // XS/S/M/L/XL/XXL - auto-derived
  committeeState: varchar('committee_state', { length: 20 }),
  // Values: null | 'draft' | 'presented' | 'discussion' | 'approved' | 'rejected'
  committeeLevel: varchar('committee_level', { length: 20 }),
  // Values: null | 'mandatory' | 'optional' | 'not_necessary' (auto-derived from budget)
  businessCaseFile: varchar('business_case_file', { length: 255 }),
  // Stores filename reference, actual file on disk
  version: integer('version').notNull().default(1), // For optimistic locking
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: varchar('created_by', { length: 255 }),
  updatedBy: varchar('updated_by', { length: 255 }),
});

// Project Teams table - Involved teams with T-shirt sizes
export const projectTeams = pgTable(
  'project_teams',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'restrict' }),
    effortSize: varchar('effort_size', { length: 5 }).notNull(), // XS/S/M/L/XL/XXL
    isLead: boolean('is_lead').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.projectId, table.teamId)]
);

// Project Values table - Value scores per outcome
export const projectValues = pgTable(
  'project_values',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    outcomeId: integer('outcome_id')
      .notNull()
      .references(() => outcomes.id, { onDelete: 'restrict' }),
    score: integer('score'), // 1-5
    justification: text('justification'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.projectId, table.outcomeId)]
);

// Project Change Impact table - Change impact teams
export const projectChangeImpact = pgTable(
  'project_change_impact',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'restrict' }),
    impactSize: varchar('impact_size', { length: 5 }).notNull(), // XS/S/M/L/XL/XXL
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.projectId, table.teamId)]
);

// Budget Lines table - Imported budget lines for projects
export const budgetLines = pgTable(
  'budget_lines',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    company: varchar('company', { length: 10 }).notNull(), // THIF, EIL
    departmentId: integer('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'restrict' }),
    costCenterId: integer('cost_center_id')
      .notNull()
      .references(() => costCenters.id, { onDelete: 'restrict' }),
    lineValue: varchar('line_value', { length: 255 }).notNull(),
    lineAmount: numeric('line_amount', { precision: 15, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(), // ISO 4217
    type: varchar('type', { length: 5 }).notNull(), // CAPEX or OPEX
    fiscalYear: integer('fiscal_year').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.company, table.costCenterId, table.lineValue, table.fiscalYear)]
);

// Project Budget Allocations table - Junction between projects and budget lines
export const projectBudgetAllocations = pgTable(
  'project_budget_allocations',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    budgetLineId: integer('budget_line_id')
      .notNull()
      .references(() => budgetLines.id, { onDelete: 'restrict' }),
    allocationAmount: numeric('allocation_amount', { precision: 15, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.projectId, table.budgetLineId)]
);

// Receipts table - Actuals tracking for receipts
export const receipts = pgTable(
  'receipts',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    receiptNumber: varchar('receipt_number', { length: 100 }).notNull(),
    company: varchar('company', { length: 100 }).notNull(),
    purchaseOrder: varchar('purchase_order', { length: 100 }).notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(), // ISO 4217
    receiptDate: date('receipt_date').notNull(),
    description: varchar('description', { length: 500 }),
    importBatch: varchar('import_batch', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    unique('unique_receipt').on(table.company, table.receiptNumber),
  ]
);

// Invoices table - Actuals tracking for invoices
// invoiceId is derived as: company||-||invoiceNumber
// Invoices are company-level, not project-level (projectId is nullable)
export const invoices = pgTable(
  'invoices',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    projectId: integer('project_id')
      .references(() => projects.id, { onDelete: 'set null' }),
    company: varchar('company', { length: 100 }).notNull(),
    invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
    purchaseOrder: varchar('purchase_order', { length: 100 }).notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(), // ISO 4217
    invoiceDate: date('invoice_date').notNull(),
    description: varchar('description', { length: 500 }),
    competenceMonth: varchar('competence_month', { length: 7 }), // YYYY-MM format
    competenceMonthExtracted: boolean('competence_month_extracted').notNull().default(false),
    competenceMonthOverride: varchar('competence_month_override', { length: 7 }), // Manual override
    importBatch: varchar('import_batch', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.company, table.invoiceNumber)]
);

// Audit trail table - tracks all project field changes
export const auditLog = pgTable('audit_log', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: integer('record_id').notNull(), // The projects.id
  changedBy: varchar('changed_by', { length: 255 }).notNull(), // User email
  changedAt: timestamp('changed_at').defaultNow().notNull(),
  operation: varchar('operation', { length: 10 }).notNull(), // INSERT, UPDATE, DELETE
  changes: jsonb('changes'), // { field: { old: val, new: val } }
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Alert configuration table
export const alertConfig = pgTable('alert_config', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  type: varchar('type', { length: 50 }).notNull().unique(), // 'overdue' | 'budget_limit'
  enabled: boolean('enabled').notNull().default(true),
  budgetThresholdPercent: integer('budget_threshold_percent'), // e.g., 90 for 90%
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
