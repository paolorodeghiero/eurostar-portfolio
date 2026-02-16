/**
 * Referential checking utilities
 *
 * NOTE: As of the referentials-first refactor, the validate stage now checks
 * CSVs against each other (not the database). This module is kept for potential
 * future use but is no longer used by the import pipeline.
 *
 * The new architecture:
 * - Extract: generates all referential CSVs from Excel
 * - Validate: checks CSV schema + cross-CSV FK consistency
 * - Load: inserts referentials first, then main data
 */

import { db } from '../../../backend/src/db/index.js';
import { teams, departments, statuses, outcomes } from '../../../backend/src/db/schema.js';

export interface ReferentialLookups {
  teams: Map<string, number>;      // name (lowercase) -> id
  departments: Map<string, number>; // name (lowercase) -> id
  statuses: Map<string, number>;    // name (lowercase) -> id
  outcomes: Map<string, number>;    // name (lowercase) -> id
}

/**
 * Load all referential lookups from database
 * Useful for checking what exists before import
 */
export async function loadReferentialLookups(): Promise<ReferentialLookups> {
  const [dbTeams, dbDepartments, dbStatuses, dbOutcomes] = await Promise.all([
    db.select().from(teams),
    db.select().from(departments),
    db.select().from(statuses),
    db.select().from(outcomes),
  ]);

  return {
    teams: new Map(dbTeams.map((t) => [t.name.toLowerCase(), t.id])),
    departments: new Map(dbDepartments.map((d) => [d.name.toLowerCase(), d.id])),
    statuses: new Map(dbStatuses.map((s) => [s.name.toLowerCase(), s.id])),
    outcomes: new Map(dbOutcomes.map((o) => [o.name.toLowerCase(), o.id])),
  };
}

/**
 * Find which names from a list don't exist in a lookup map
 */
export function findMissing(names: string[], lookup: Map<string, number>): string[] {
  const missing = new Set<string>();
  for (const name of names) {
    if (name && !lookup.has(name.toLowerCase())) {
      missing.add(name);
    }
  }
  return Array.from(missing);
}
