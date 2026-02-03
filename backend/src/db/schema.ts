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
  isStopped: boolean('is_stopped').notNull().default(false),
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
