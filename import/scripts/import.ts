#!/usr/bin/env npx tsx
import { parseArgs } from 'node:util';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { values, positionals } = parseArgs({
  options: {
    extract: { type: 'boolean', short: 'e' },
    validate: { type: 'boolean', short: 'v' },
    load: { type: 'boolean', short: 'l' },
    all: { type: 'boolean', short: 'a' },
    'dry-run': { type: 'boolean', short: 'd' },
    file: { type: 'string', short: 'f' },
    source: { type: 'string', short: 's' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
});

function printHelp(): void {
  console.log(`
Portfolio Data Import Tool
==========================

Import project data from TPO Portfolio.xlsx into the database.

ARCHITECTURE: Referentials-First Approach
------------------------------------------
The import process uses a staged CSV approach where:
1. Extract produces CSVs for ALL data (referentials + main data)
2. Validate checks all CSVs for schema and cross-CSV consistency
3. Load inserts referentials first (in FK order), then main data

This ensures:
- All referentials are explicitly defined in CSVs
- Validation catches mismatches before touching the database
- Load is deterministic with no auto-creation surprises

WORKFLOW
--------
The import process has three stages:

  1. EXTRACT - Read Excel file, generate all CSV staging files
     Referentials: departments.csv, teams.csv, statuses.csv, outcomes.csv
     Main data:    projects.csv, project_teams.csv, project_values.csv, project_impact.csv
     Review:       Check extraction_report.md for warnings

  2. VALIDATE - Check CSV data for schema and cross-CSV consistency
     Checks:       Schema compliance, FK relationships between CSVs
     Review:       Check validation_report.md for errors

  3. LOAD - Insert data into database in FK order
     Order:        departments -> teams -> statuses -> outcomes -> projects -> ...
     Handles:      Conflicts, merge strategy, import tracking
     Review:       Check load_report.md for results

USAGE
-----
  npx tsx import.ts [options]

OPTIONS
-------
  Stage Selection (at least one required):
    -e, --extract       Run extract stage
    -v, --validate      Run validate stage
    -l, --load          Run load stage
    -a, --all           Run all stages sequentially

  Extract Options:
    -f, --file <path>   Excel file path (default: TPO Portfolio.xlsx)

  Load Options:
    -d, --dry-run       Show changes without modifying database
    -s, --source <name> Import source name for tracking

  General:
    -h, --help          Show this help message

EXAMPLES
--------
  # Run full import with review between stages
  npx tsx import.ts -e                  # Extract first
  # Review staging/extraction_report.md
  npx tsx import.ts -v                  # Validate
  # Review staging/validation_report.md
  npx tsx import.ts -l --dry-run        # Preview changes
  npx tsx import.ts -l                  # Load for real

  # Run all stages at once (be careful!)
  npx tsx import.ts --all

  # Run with specific file
  npx tsx import.ts -e -f "My Portfolio.xlsx"

  # Dry run the full pipeline
  npx tsx import.ts --all --dry-run

FILE STRUCTURE
--------------
  backend/import/
    source/               Excel source files (gitignored)
      TPO Portfolio.xlsx  Default source file

    staging/              Generated CSV files (gitignored)
      # Referentials (inserted first)
      departments.csv
      teams.csv
      statuses.csv
      outcomes.csv

      # Main data (inserted after referentials)
      projects.csv
      project_teams.csv
      project_values.csv
      project_impact.csv
      budget.csv

      # Reports
      extraction_report.md
      validation_report.md
      load_report.md

    mappings/             YAML configuration (committed)
      status-mapping.yaml
      team-mapping.yaml
      outcome-mapping.yaml
      tshirt-mapping.yaml

    scripts/              Import scripts (committed)
      import.ts           This orchestrator
      extract.ts          Stage 1: Excel -> CSV (referentials + main data)
      validate.ts         Stage 2: CSV schema + cross-CSV validation
      load.ts             Stage 3: CSV -> Database (FK-ordered)
      lib/                Utility modules
`);
}

async function runScript(script: string, args: string[]): Promise<number> {
  return new Promise((resolve) => {
    const scriptPath = join(__dirname, script);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${script} ${args.join(' ')}`);
    console.log('='.repeat(60) + '\n');

    const child = spawn('npx', ['tsx', scriptPath, ...args], {
      stdio: 'inherit',
      cwd: join(__dirname, '../..'),
    });

    child.on('close', (code) => {
      resolve(code ?? 1);
    });
  });
}

async function main(): Promise<void> {
  if (values.help) {
    printHelp();
    process.exit(0);
  }

  const runExtract = values.extract || values.all;
  const runValidate = values.validate || values.all;
  const runLoad = values.load || values.all;

  if (!runExtract && !runValidate && !runLoad) {
    console.log('No stage specified. Use --help for usage information.');
    console.log('');
    console.log('Quick start:');
    console.log('  npx tsx import.ts -e              Extract from Excel');
    console.log('  npx tsx import.ts -v              Validate staging data');
    console.log('  npx tsx import.ts -l --dry-run    Preview database changes');
    console.log('  npx tsx import.ts -l              Load to database');
    console.log('  npx tsx import.ts --all           Run all stages');
    process.exit(1);
  }

  let exitCode = 0;

  if (runExtract) {
    const args: string[] = [];
    if (values.file) args.push('-f', values.file);
    if (positionals.length > 0) args.push(positionals[0]);

    exitCode = await runScript('extract.ts', args);
    if (exitCode !== 0) {
      console.error('\nExtract stage failed. Fix errors before continuing.');
      process.exit(exitCode);
    }
  }

  if (runValidate) {
    const args: string[] = [];

    exitCode = await runScript('validate.ts', args);
    if (exitCode !== 0) {
      console.error('\nValidate stage failed. Fix errors before continuing.');
      process.exit(exitCode);
    }
  }

  if (runLoad) {
    const args: string[] = [];
    if (values['dry-run']) args.push('--dry-run');
    if (values.source) args.push('-s', values.source);

    exitCode = await runScript('load.ts', args);
    if (exitCode !== 0) {
      console.error('\nLoad stage failed.');
      process.exit(exitCode);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Import complete!');
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
