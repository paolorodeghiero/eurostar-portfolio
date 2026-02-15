import { asc, isNull } from 'drizzle-orm';
import { committeeThresholds } from '../db/schema.js';

// Committee state type
export type CommitteeState = 'draft' | 'presented' | 'discussion' | 'approved' | 'rejected';

// Allowed state transitions
export const COMMITTEE_TRANSITIONS: Record<CommitteeState, CommitteeState[]> = {
  draft: ['presented'],
  presented: ['discussion', 'rejected'],
  discussion: ['approved', 'rejected', 'presented'], // Can go back to presented
  approved: [], // Terminal state
  rejected: [], // Terminal state
};

// Check if a state transition is valid
export function canTransition(from: CommitteeState | null, to: CommitteeState): boolean {
  // If no current state, can only go to 'draft'
  if (from === null) {
    return to === 'draft';
  }
  return COMMITTEE_TRANSITIONS[from].includes(to);
}

// Get allowed next states from current state
export function getAllowedTransitions(from: CommitteeState | null): CommitteeState[] {
  if (from === null) {
    return ['draft'];
  }
  return COMMITTEE_TRANSITIONS[from];
}

// Committee level type
export type CommitteeLevel = 'mandatory' | 'optional' | 'not_necessary';

// Determine committee level based on total budget (EUR-only)
export async function determineCommitteeLevel(
  db: any,
  totalBudget: number
): Promise<CommitteeLevel> {
  // Get thresholds ordered by maxAmount ascending (nulls last)
  // Find first threshold where totalBudget <= maxAmount (or maxAmount is null)
  const thresholds = await db
    .select()
    .from(committeeThresholds)
    .orderBy(asc(committeeThresholds.maxAmount));

  for (const threshold of thresholds) {
    // If maxAmount is null, it's unlimited (mandatory for anything above previous threshold)
    if (threshold.maxAmount === null) {
      return threshold.level as CommitteeLevel;
    }

    const max = parseFloat(threshold.maxAmount);
    if (totalBudget <= max) {
      return threshold.level as CommitteeLevel;
    }
  }

  // Default if no threshold matches (shouldn't happen with proper seed data)
  return 'not_necessary';
}

// Validate committee state value
export function isValidCommitteeState(state: string): state is CommitteeState {
  return ['draft', 'presented', 'discussion', 'approved', 'rejected'].includes(state);
}
