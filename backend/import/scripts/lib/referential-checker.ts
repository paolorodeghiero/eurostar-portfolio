import { db } from '../../../src/db/index.js';
import { teams, departments, statuses, outcomes } from '../../../src/db/schema.js';
import { eq } from 'drizzle-orm';

export interface ReferentialCheckResult {
  valid: boolean;
  existingTeams: Map<string, number>;      // name -> id
  existingDepartments: Map<string, number>; // name -> id
  existingStatuses: Map<string, number>;    // name -> id
  existingOutcomes: Map<string, number>;    // name -> id
  missingTeams: string[];
  missingDepartments: string[];
  missingStatuses: string[];
  missingOutcomes: string[];
}

/**
 * Check which referentials exist in database and which are missing
 */
export async function checkReferentials(
  teamNames: string[],
  departmentNames: string[],
  statusNames: string[],
  outcomeNames: string[]
): Promise<ReferentialCheckResult> {
  // Load existing referentials
  const [dbTeams, dbDepartments, dbStatuses, dbOutcomes] = await Promise.all([
    db.select().from(teams),
    db.select().from(departments),
    db.select().from(statuses),
    db.select().from(outcomes),
  ]);

  // Build lookup maps
  const existingTeams = new Map(dbTeams.map((t) => [t.name.toLowerCase(), t.id]));
  const existingDepartments = new Map(dbDepartments.map((d) => [d.name.toLowerCase(), d.id]));
  const existingStatuses = new Map(dbStatuses.map((s) => [s.name.toLowerCase(), s.id]));
  const existingOutcomes = new Map(dbOutcomes.map((o) => [o.name.toLowerCase(), o.id]));

  // Find missing
  const missingTeams = Array.from(new Set(
    teamNames.filter((name) => name && !existingTeams.has(name.toLowerCase()))
  ));
  const missingDepartments = Array.from(new Set(
    departmentNames.filter((name) => name && !existingDepartments.has(name.toLowerCase()))
  ));
  const missingStatuses = Array.from(new Set(
    statusNames.filter((name) => name && !existingStatuses.has(name.toLowerCase()))
  ));
  const missingOutcomes = Array.from(new Set(
    outcomeNames.filter((name) => name && !existingOutcomes.has(name.toLowerCase()))
  ));

  return {
    valid: missingStatuses.length === 0 && missingOutcomes.length === 0,
    existingTeams,
    existingDepartments,
    existingStatuses,
    existingOutcomes,
    missingTeams,
    missingDepartments,
    missingStatuses,
    missingOutcomes,
  };
}

/**
 * Get team ID by name (case-insensitive)
 */
export async function getTeamId(name: string): Promise<number | null> {
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.name, name))
    .limit(1);
  return team?.id ?? null;
}

/**
 * Get status ID by name (case-insensitive)
 */
export async function getStatusId(name: string): Promise<number | null> {
  const result = await db.select().from(statuses);
  const match = result.find((s) => s.name.toLowerCase() === name.toLowerCase());
  return match?.id ?? null;
}

/**
 * Get outcome ID by name (case-insensitive)
 */
export async function getOutcomeId(name: string): Promise<number | null> {
  const result = await db.select().from(outcomes);
  const match = result.find((o) => o.name.toLowerCase() === name.toLowerCase());
  return match?.id ?? null;
}

/**
 * Create missing teams in a department (for auto-create mode)
 */
export async function createMissingTeams(
  teamNames: string[],
  defaultDepartmentId: number
): Promise<Map<string, number>> {
  const created = new Map<string, number>();

  for (const name of teamNames) {
    const [team] = await db
      .insert(teams)
      .values({
        name,
        description: 'Auto-created during import',
        departmentId: defaultDepartmentId,
      })
      .returning();
    created.set(name.toLowerCase(), team.id);
    console.log(`  Created team: ${name}`);
  }

  return created;
}

/**
 * Create missing departments (for auto-create mode)
 */
export async function createMissingDepartments(
  departmentNames: string[]
): Promise<Map<string, number>> {
  const created = new Map<string, number>();

  for (const name of departmentNames) {
    const [dept] = await db
      .insert(departments)
      .values({ name })
      .returning();
    created.set(name.toLowerCase(), dept.id);
    console.log(`  Created department: ${name}`);
  }

  return created;
}
