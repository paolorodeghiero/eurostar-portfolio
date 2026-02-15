import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MAPPINGS_DIR = join(__dirname, '../../mappings');

// Type definitions
interface StatusMapping {
  statuses: Record<string, string>;
  default: string;
}

interface TeamMapping {
  teams: Record<string, string>;
  departments: Record<string, string>;
  auto_create_missing: boolean;
}

interface OutcomeMapping {
  outcomes: Record<string, string>;
}

interface TshirtMapping {
  effort_sizes: Record<string, string | null>;
  impact_sizes: Record<string, string | null>;
  default: string;
}

// Cached mappings
let statusCache: StatusMapping | null = null;
let teamCache: TeamMapping | null = null;
let outcomeCache: OutcomeMapping | null = null;
let tshirtCache: TshirtMapping | null = null;

function loadYaml<T>(filename: string): T {
  const path = join(MAPPINGS_DIR, filename);
  const content = readFileSync(path, 'utf8');
  return yaml.load(content) as T;
}

export function loadStatusMapping(): StatusMapping {
  if (!statusCache) {
    statusCache = loadYaml<StatusMapping>('status-mapping.yaml');
  }
  return statusCache;
}

export function loadTeamMapping(): TeamMapping {
  if (!teamCache) {
    teamCache = loadYaml<TeamMapping>('team-mapping.yaml');
  }
  return teamCache;
}

export function loadOutcomeMapping(): OutcomeMapping {
  if (!outcomeCache) {
    outcomeCache = loadYaml<OutcomeMapping>('outcome-mapping.yaml');
  }
  return outcomeCache;
}

export function loadTshirtMapping(): TshirtMapping {
  if (!tshirtCache) {
    tshirtCache = loadYaml<TshirtMapping>('tshirt-mapping.yaml');
  }
  return tshirtCache;
}

// Convenience methods
export function mapStatus(excelValue: string): string {
  const mapping = loadStatusMapping();
  return mapping.statuses[excelValue] ?? mapping.statuses[excelValue.toLowerCase()] ?? mapping.default;
}

export function mapTeamName(excelValue: string): string {
  const mapping = loadTeamMapping();
  return mapping.teams?.[excelValue] ?? excelValue.trim();
}

export function mapDepartmentName(excelValue: string): string {
  const mapping = loadTeamMapping();
  return mapping.departments?.[excelValue] ?? excelValue.trim();
}

export function mapOutcomeName(excelColumn: string): string | null {
  const mapping = loadOutcomeMapping();
  return mapping.outcomes[excelColumn] ?? null;
}

export function mapEffortSize(lmhValue: string): string | null {
  const mapping = loadTshirtMapping();
  const result = mapping.effort_sizes[lmhValue.toUpperCase()];
  return result === undefined ? mapping.default : result;
}

export function mapImpactSize(lmhValue: string): string | null {
  const mapping = loadTshirtMapping();
  const result = mapping.impact_sizes[lmhValue.toUpperCase()];
  return result === undefined ? mapping.default : result;
}

export function shouldAutoCreateMissing(): boolean {
  return loadTeamMapping().auto_create_missing;
}

// Clear cache (for testing or reloading)
export function clearMappingCache(): void {
  statusCache = null;
  teamCache = null;
  outcomeCache = null;
  tshirtCache = null;
}
