import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  departments,
  teams,
  statuses,
  outcomes,
  costCenters,
  committeeLevels,
  committeeThresholds,
  costTshirtThresholds,
  projectIdCounters,
  projects,
  projectTeams,
  projectValues,
  projectChangeImpact,
  budgetLines,
  projectBudgetAllocations,
  receipts,
  invoices,
} from '../../db/schema.js';

/**
 * Seed minimal required test data for backend tests
 * Creates deterministic data with fixed IDs for reliable assertions
 */
export async function seedTestData(db: any) {
  // Insert departments
  const [dept1] = await db
    .insert(departments)
    .values({ name: 'IT Department' })
    .returning();
  const [dept2] = await db
    .insert(departments)
    .values({ name: 'Finance Department' })
    .returning();

  // Insert teams
  const [team1] = await db
    .insert(teams)
    .values({ name: 'Backend Team', departmentId: dept1.id, description: 'Backend development' })
    .returning();
  const [team2] = await db
    .insert(teams)
    .values({ name: 'Finance Team', departmentId: dept2.id, description: 'Financial operations' })
    .returning();

  // Insert statuses
  const [statusDraft] = await db
    .insert(statuses)
    .values({ name: 'Draft', color: '#6b7280', displayOrder: 1, isSystemStatus: true, isReadOnly: false })
    .returning();
  const [statusActive] = await db
    .insert(statuses)
    .values({ name: 'Active', color: '#10b981', displayOrder: 2, isSystemStatus: false, isReadOnly: false })
    .returning();
  const [statusCompleted] = await db
    .insert(statuses)
    .values({ name: 'Completed', color: '#3b82f6', displayOrder: 3, isSystemStatus: true, isReadOnly: true })
    .returning();

  // Insert outcomes
  const [outcome1] = await db
    .insert(outcomes)
    .values({
      name: 'Customer Satisfaction',
      score1Example: 'Poor',
      score2Example: 'Fair',
      score3Example: 'Good',
      score4Example: 'Very Good',
      score5Example: 'Excellent',
    })
    .returning();
  const [outcome2] = await db
    .insert(outcomes)
    .values({
      name: 'Operational Efficiency',
      score1Example: 'Minimal',
      score2Example: 'Low',
      score3Example: 'Moderate',
      score4Example: 'High',
      score5Example: 'Very High',
    })
    .returning();

  // Insert cost centers
  const [costCenter1] = await db
    .insert(costCenters)
    .values({ code: 'CC-001', description: 'IT Operations' })
    .returning();
  const [costCenter2] = await db
    .insert(costCenters)
    .values({ code: 'CC-002', description: 'Finance Operations' })
    .returning();

  // Insert committee levels
  const [levelNotNecessary] = await db
    .insert(committeeLevels)
    .values({ name: 'not_necessary', mandatory: false, displayOrder: 1 })
    .returning();
  const [levelOptional] = await db
    .insert(committeeLevels)
    .values({ name: 'optional', mandatory: false, displayOrder: 2 })
    .returning();
  const [levelMandatory] = await db
    .insert(committeeLevels)
    .values({ name: 'mandatory', mandatory: true, displayOrder: 3 })
    .returning();

  // Insert committee thresholds (EUR-only)
  await db.insert(committeeThresholds).values({ levelId: levelNotNecessary.id, maxAmount: '50000.00' });
  await db.insert(committeeThresholds).values({ levelId: levelOptional.id, maxAmount: '250000.00' });
  await db.insert(committeeThresholds).values({ levelId: levelMandatory.id, maxAmount: null }); // Unlimited

  // Insert cost T-shirt thresholds (EUR)
  await db.insert(costTshirtThresholds).values({ size: 'XS', maxAmount: '10000.00', currency: 'EUR' });
  await db.insert(costTshirtThresholds).values({ size: 'S', maxAmount: '50000.00', currency: 'EUR' });
  await db.insert(costTshirtThresholds).values({ size: 'M', maxAmount: '100000.00', currency: 'EUR' });
  await db.insert(costTshirtThresholds).values({ size: 'L', maxAmount: '250000.00', currency: 'EUR' });
  await db.insert(costTshirtThresholds).values({ size: 'XL', maxAmount: '500000.00', currency: 'EUR' });
  await db.insert(costTshirtThresholds).values({ size: 'XXL', maxAmount: '999999999.00', currency: 'EUR' });

  // Insert cost T-shirt thresholds (GBP) - approx 0.85 conversion
  await db.insert(costTshirtThresholds).values({ size: 'XS', maxAmount: '8500.00', currency: 'GBP' });
  await db.insert(costTshirtThresholds).values({ size: 'S', maxAmount: '42500.00', currency: 'GBP' });
  await db.insert(costTshirtThresholds).values({ size: 'M', maxAmount: '85000.00', currency: 'GBP' });
  await db.insert(costTshirtThresholds).values({ size: 'L', maxAmount: '212500.00', currency: 'GBP' });
  await db.insert(costTshirtThresholds).values({ size: 'XL', maxAmount: '425000.00', currency: 'GBP' });
  await db.insert(costTshirtThresholds).values({ size: 'XXL', maxAmount: '999999999.00', currency: 'GBP' });

  // Initialize project ID counter
  await db.insert(projectIdCounters).values({ year: 2026, lastId: 0 });

  return {
    departments: { dept1, dept2 },
    teams: { team1, team2 },
    statuses: { statusDraft, statusActive, statusCompleted },
    outcomes: { outcome1, outcome2 },
    costCenters: { costCenter1, costCenter2 },
    committeeLevels: { levelNotNecessary, levelOptional, levelMandatory },
  };
}

/**
 * Clear all test data in FK-safe order
 */
export async function clearTestData(db: any) {
  // Delete in FK-safe order (children before parents)
  await db.delete(projectBudgetAllocations);
  await db.delete(budgetLines);
  await db.delete(receipts);
  await db.delete(invoices);
  await db.delete(projectChangeImpact);
  await db.delete(projectValues);
  await db.delete(projectTeams);
  await db.delete(projects);
  await db.delete(projectIdCounters);
  await db.delete(costTshirtThresholds);
  await db.delete(committeeThresholds);
  await db.delete(committeeLevels);
  await db.delete(costCenters);
  await db.delete(outcomes);
  await db.delete(teams);
  await db.delete(departments);
  await db.delete(statuses);
}

/**
 * Create a test project with sensible defaults and optional overrides
 */
export async function createTestProject(db: any, overrides: Partial<any> = {}) {
  // Get a team ID for the lead team (assume seedTestData has been called)
  const teamsList = await db.select().from(teams).limit(1);
  if (teamsList.length === 0) {
    throw new Error('No teams available. Run seedTestData first.');
  }

  const defaultTeamId = teamsList[0].id;

  // Get a status ID (default to Draft)
  const statusList = await db.select().from(statuses).limit(1);
  const defaultStatusId = statusList.length > 0 ? statusList[0].id : null;

  const [project] = await db
    .insert(projects)
    .values({
      projectId: overrides.projectId || `PRJ-2026-${String(Math.floor(Math.random() * 1000)).padStart(5, '0')}`,
      name: overrides.name || 'Test Project',
      leadTeamId: overrides.leadTeamId || defaultTeamId,
      statusId: overrides.statusId !== undefined ? overrides.statusId : defaultStatusId,
      startDate: overrides.startDate || null,
      endDate: overrides.endDate || null,
      description: overrides.description || 'A test project',
      opexBudget: overrides.opexBudget || null,
      capexBudget: overrides.capexBudget || null,
      budgetCurrency: overrides.budgetCurrency || 'EUR',
      createdBy: overrides.createdBy || 'test-user',
      updatedBy: overrides.updatedBy || 'test-user',
    })
    .returning();

  return project;
}
