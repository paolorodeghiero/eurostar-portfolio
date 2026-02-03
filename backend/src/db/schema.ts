import {
  pgTable,
  integer,
  varchar,
  text,
  timestamp,
  numeric,
  date,
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
