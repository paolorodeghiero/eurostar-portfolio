// T-shirt size order for comparison
const TSHIRT_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
type TshirtSize = typeof TSHIRT_ORDER[number];

/**
 * Derive global effort T-shirt from team sizes.
 * Algorithm: Returns the maximum T-shirt size from all teams.
 * Rationale: The project effort is at least as large as its largest team's commitment.
 */
export function deriveGlobalEffort(teams: { effortSize: string }[]): TshirtSize | null {
  if (!teams || teams.length === 0) return null;

  let maxIndex = -1;
  for (const team of teams) {
    const index = TSHIRT_ORDER.indexOf(team.effortSize as TshirtSize);
    if (index > maxIndex) {
      maxIndex = index;
    }
  }

  return maxIndex >= 0 ? TSHIRT_ORDER[maxIndex] : null;
}

/**
 * Derive global impact T-shirt from impact team sizes.
 * Same algorithm as effort - returns max size.
 */
export function deriveGlobalImpact(impactTeams: { impactSize: string }[]): TshirtSize | null {
  if (!impactTeams || impactTeams.length === 0) return null;

  let maxIndex = -1;
  for (const team of impactTeams) {
    const index = TSHIRT_ORDER.indexOf(team.impactSize as TshirtSize);
    if (index > maxIndex) {
      maxIndex = index;
    }
  }

  return maxIndex >= 0 ? TSHIRT_ORDER[maxIndex] : null;
}

export const TSHIRT_COLORS: Record<string, string> = {
  XS: 'bg-gray-300 text-gray-800',
  S: 'bg-blue-300 text-blue-800',
  M: 'bg-green-300 text-green-800',
  L: 'bg-yellow-300 text-yellow-800',
  XL: 'bg-orange-300 text-orange-800',
  XXL: 'bg-red-300 text-red-800',
};
