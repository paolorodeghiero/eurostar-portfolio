import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

export type ConflictResolution = 'skip' | 'update' | 'overwrite' | 'skip_all' | 'update_all' | 'overwrite_all';

interface ConflictContext {
  projectRefId: string;
  projectName: string;
  existing: Record<string, any>;
  incoming: Record<string, any>;
  fieldsChanged: string[];
}

let globalResolution: ConflictResolution | null = null;
let rl: ReturnType<typeof createInterface> | null = null;

function getReadline(): ReturnType<typeof createInterface> {
  if (!rl) {
    rl = createInterface({ input: stdin, output: stdout });
  }
  return rl;
}

export function closeReadline(): void {
  if (rl) {
    rl.close();
    rl = null;
  }
}

/**
 * Resolve a conflict between existing and incoming project data
 */
export async function resolveConflict(context: ConflictContext): Promise<ConflictResolution> {
  // Check if user selected "all" option previously
  if (globalResolution) {
    return globalResolution.replace('_all', '') as ConflictResolution;
  }

  const readline = getReadline();

  console.log('\n' + '='.repeat(60));
  console.log(`CONFLICT: ${context.projectRefId} - ${context.projectName}`);
  console.log('='.repeat(60));

  console.log('\nFields with differences:');
  for (const field of context.fieldsChanged) {
    console.log(`  ${field}:`);
    console.log(`    Existing: ${formatValue(context.existing[field])}`);
    console.log(`    Incoming: ${formatValue(context.incoming[field])}`);
  }

  console.log('\nOptions:');
  console.log('  [s] Skip - keep existing, ignore incoming');
  console.log('  [u] Update - merge incoming fields into existing');
  console.log('  [o] Overwrite - replace existing with incoming');
  console.log('  [S] Skip All - skip all remaining conflicts');
  console.log('  [U] Update All - update all remaining conflicts');
  console.log('  [O] Overwrite All - overwrite all remaining conflicts');

  const answer = await readline.question('\nAction? [s/u/o/S/U/O]: ');

  switch (answer.trim()) {
    case 's':
      return 'skip';
    case 'u':
      return 'update';
    case 'o':
      return 'overwrite';
    case 'S':
      globalResolution = 'skip_all';
      return 'skip';
    case 'U':
      globalResolution = 'update_all';
      return 'update';
    case 'O':
      globalResolution = 'overwrite_all';
      return 'overwrite';
    default:
      console.log('Invalid option, defaulting to skip');
      return 'skip';
  }
}

/**
 * Compare two project records and identify changed fields
 */
export function findChangedFields(
  existing: Record<string, any>,
  incoming: Record<string, any>,
  fields: string[]
): string[] {
  const changed: string[] = [];

  for (const field of fields) {
    const existingVal = existing[field];
    const incomingVal = incoming[field];

    // Normalize for comparison
    const normExisting = normalizeValue(existingVal);
    const normIncoming = normalizeValue(incomingVal);

    if (normExisting !== normIncoming) {
      changed.push(field);
    }
  }

  return changed;
}

function normalizeValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value.toString();
  return value.toString().trim();
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '(empty)';
  if (value === '') return '(empty)';
  const str = value.toString();
  if (str.length > 50) return str.substring(0, 47) + '...';
  return str;
}

/**
 * Reset global resolution (for testing or new import runs)
 */
export function resetGlobalResolution(): void {
  globalResolution = null;
}
