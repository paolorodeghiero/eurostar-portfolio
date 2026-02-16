import { parseArgs } from 'node:util';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { parseFile } from '@fast-csv/parse';
import { z } from 'zod';
import { writeReport } from './lib/csv-writer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STAGING_DIR = join(__dirname, '../staging');

// Schemas for referential CSVs
const departmentSchema = z.object({
  name: z.string().min(1),
});

const teamRefSchema = z.object({
  name: z.string().min(1),
  departmentName: z.string().min(1),
});

const statusSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  displayOrder: z.string().transform(Number),
});

const outcomeSchema = z.object({
  name: z.string().min(1),
});

// Schemas for main data CSVs
const projectSchema = z.object({
  rowNumber: z.string().transform(Number),
  refId: z.string().min(1),
  name: z.string().min(1),
  status: z.string().min(1),
  leadTeam: z.string(),
  departmentOwner: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  isOwner: z.string(),
  opexBudget: z.string().transform(Number),
  capexBudget: z.string().transform(Number),
});

const projectTeamSchema = z.object({
  projectRefId: z.string().min(1),
  teamName: z.string().min(1),
  effortSize: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
  isLead: z.string().transform((v) => v === 'true'),
});

const projectValueSchema = z.object({
  projectRefId: z.string().min(1),
  outcomeName: z.string().min(1),
  score: z.string().transform(Number).refine((n) => n >= 1 && n <= 5),
});

const projectImpactSchema = z.object({
  projectRefId: z.string().min(1),
  departmentName: z.string().min(1),
  impactSize: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
});

const budgetSchema = z.object({
  projectRefId: z.string().min(1),
  opexAmount: z.string().transform(Number),
  capexAmount: z.string().transform(Number),
  currency: z.string().length(3),
});

interface ValidationError {
  file: string;
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

async function parseCsv<T>(
  filePath: string,
  schema: z.ZodSchema<T>
): Promise<{ data: T[]; errors: ValidationError[] }> {
  return new Promise((resolve) => {
    const data: T[] = [];
    const errors: ValidationError[] = [];
    let rowNum = 1;
    const fileName = filePath.split('/').pop() || filePath;

    parseFile(filePath, { headers: true })
      .on('data', (row) => {
        rowNum++;
        const result = schema.safeParse(row);
        if (result.success) {
          data.push(result.data);
        } else {
          for (const issue of result.error.issues) {
            errors.push({
              file: fileName,
              row: rowNum,
              field: issue.path.join('.'),
              message: issue.message,
              severity: 'error',
            });
          }
        }
      })
      .on('end', () => resolve({ data, errors }))
      .on('error', (err) => {
        errors.push({
          file: fileName,
          row: 0,
          field: 'file',
          message: err.message,
          severity: 'error',
        });
        resolve({ data, errors });
      });
  });
}

async function validate(): Promise<void> {
  console.log('\nValidating staging CSV files...\n');

  const allErrors: ValidationError[] = [];
  let totalRows = 0;

  // Check all required files exist
  const referentialFiles = ['departments.csv', 'teams.csv', 'statuses.csv', 'outcomes.csv'];
  const mainDataFiles = ['projects.csv', 'project_teams.csv', 'project_values.csv', 'project_impact.csv', 'budget.csv'];
  const allRequiredFiles = [...referentialFiles, ...mainDataFiles];

  for (const file of allRequiredFiles) {
    const path = join(STAGING_DIR, file);
    if (!existsSync(path)) {
      console.error(`Missing file: ${file}`);
      console.error('Run extract stage first: npx tsx extract.ts');
      process.exit(1);
    }
  }

  // ===== PHASE 1: Validate referential CSVs =====
  console.log('--- Phase 1: Validating referential CSVs ---\n');

  console.log('Validating departments.csv...');
  const departmentsResult = await parseCsv(join(STAGING_DIR, 'departments.csv'), departmentSchema);
  allErrors.push(...departmentsResult.errors);
  totalRows += departmentsResult.data.length;
  console.log(`  ${departmentsResult.data.length} rows, ${departmentsResult.errors.length} errors`);

  console.log('Validating teams.csv...');
  const teamsResult = await parseCsv(join(STAGING_DIR, 'teams.csv'), teamRefSchema);
  allErrors.push(...teamsResult.errors);
  totalRows += teamsResult.data.length;
  console.log(`  ${teamsResult.data.length} rows, ${teamsResult.errors.length} errors`);

  console.log('Validating statuses.csv...');
  const statusesResult = await parseCsv(join(STAGING_DIR, 'statuses.csv'), statusSchema);
  allErrors.push(...statusesResult.errors);
  totalRows += statusesResult.data.length;
  console.log(`  ${statusesResult.data.length} rows, ${statusesResult.errors.length} errors`);

  console.log('Validating outcomes.csv...');
  const outcomesResult = await parseCsv(join(STAGING_DIR, 'outcomes.csv'), outcomeSchema);
  allErrors.push(...outcomesResult.errors);
  totalRows += outcomesResult.data.length;
  console.log(`  ${outcomesResult.data.length} rows, ${outcomesResult.errors.length} errors`);

  // Build in-memory lookup maps from referential CSVs
  const departmentSet = new Set(departmentsResult.data.map((d) => d.name.toLowerCase()));
  const teamSet = new Set(teamsResult.data.map((t) => t.name.toLowerCase()));
  const statusSet = new Set(statusesResult.data.map((s) => s.name.toLowerCase()));
  const outcomeSet = new Set(outcomesResult.data.map((o) => o.name.toLowerCase()));

  console.log('\nReferential lookup maps built:');
  console.log(`  Departments: ${departmentSet.size}`);
  console.log(`  Teams: ${teamSet.size}`);
  console.log(`  Statuses: ${statusSet.size}`);
  console.log(`  Outcomes: ${outcomeSet.size}`);

  // Validate teams.csv references departments.csv
  for (let i = 0; i < teamsResult.data.length; i++) {
    const team = teamsResult.data[i];
    if (!departmentSet.has(team.departmentName.toLowerCase())) {
      allErrors.push({
        file: 'teams.csv',
        row: i + 2,
        field: 'departmentName',
        message: `Unknown department "${team.departmentName}" (not in departments.csv)`,
        severity: 'error',
      });
    }
  }

  // ===== PHASE 2: Validate main data CSVs =====
  console.log('\n--- Phase 2: Validating main data CSVs ---\n');

  console.log('Validating projects.csv...');
  const projectsResult = await parseCsv(join(STAGING_DIR, 'projects.csv'), projectSchema);
  allErrors.push(...projectsResult.errors);
  totalRows += projectsResult.data.length;
  console.log(`  ${projectsResult.data.length} rows, ${projectsResult.errors.length} errors`);

  console.log('Validating project_teams.csv...');
  const projectTeamsResult = await parseCsv(join(STAGING_DIR, 'project_teams.csv'), projectTeamSchema);
  allErrors.push(...projectTeamsResult.errors);
  totalRows += projectTeamsResult.data.length;
  console.log(`  ${projectTeamsResult.data.length} rows, ${projectTeamsResult.errors.length} errors`);

  console.log('Validating project_values.csv...');
  const projectValuesResult = await parseCsv(join(STAGING_DIR, 'project_values.csv'), projectValueSchema);
  allErrors.push(...projectValuesResult.errors);
  totalRows += projectValuesResult.data.length;
  console.log(`  ${projectValuesResult.data.length} rows, ${projectValuesResult.errors.length} errors`);

  console.log('Validating project_impact.csv...');
  const projectImpactResult = await parseCsv(join(STAGING_DIR, 'project_impact.csv'), projectImpactSchema);
  allErrors.push(...projectImpactResult.errors);
  totalRows += projectImpactResult.data.length;
  console.log(`  ${projectImpactResult.data.length} rows, ${projectImpactResult.errors.length} errors`);

  console.log('Validating budget.csv...');
  const budgetsResult = await parseCsv(join(STAGING_DIR, 'budget.csv'), budgetSchema);
  allErrors.push(...budgetsResult.errors);
  totalRows += budgetsResult.data.length;
  console.log(`  ${budgetsResult.data.length} rows, ${budgetsResult.errors.length} errors`);

  // Build project refId set for FK validation
  const projectRefIds = new Set(projectsResult.data.map((p) => p.refId));

  // ===== PHASE 3: Cross-CSV referential validation =====
  console.log('\n--- Phase 3: Cross-CSV referential validation ---\n');

  // Validate projects.csv against referentials
  console.log('Checking projects.csv references...');
  let projectRefErrors = 0;
  for (let i = 0; i < projectsResult.data.length; i++) {
    const project = projectsResult.data[i];

    if (project.status && !statusSet.has(project.status.toLowerCase())) {
      allErrors.push({
        file: 'projects.csv',
        row: i + 2,
        field: 'status',
        message: `Unknown status "${project.status}" (not in statuses.csv)`,
        severity: 'error',
      });
      projectRefErrors++;
    }

    if (project.leadTeam && !teamSet.has(project.leadTeam.toLowerCase())) {
      allErrors.push({
        file: 'projects.csv',
        row: i + 2,
        field: 'leadTeam',
        message: `Unknown team "${project.leadTeam}" (not in teams.csv)`,
        severity: 'error',
      });
      projectRefErrors++;
    }

    if (project.departmentOwner && !departmentSet.has(project.departmentOwner.toLowerCase())) {
      allErrors.push({
        file: 'projects.csv',
        row: i + 2,
        field: 'departmentOwner',
        message: `Unknown department "${project.departmentOwner}" (not in departments.csv)`,
        severity: 'error',
      });
      projectRefErrors++;
    }
  }
  console.log(`  ${projectRefErrors} referential errors`);

  // Validate project_teams.csv
  console.log('Checking project_teams.csv references...');
  let teamRefErrors = 0;
  for (let i = 0; i < projectTeamsResult.data.length; i++) {
    const pt = projectTeamsResult.data[i];

    if (!projectRefIds.has(pt.projectRefId)) {
      allErrors.push({
        file: 'project_teams.csv',
        row: i + 2,
        field: 'projectRefId',
        message: `Unknown project "${pt.projectRefId}" (not in projects.csv)`,
        severity: 'error',
      });
      teamRefErrors++;
    }

    if (!teamSet.has(pt.teamName.toLowerCase())) {
      allErrors.push({
        file: 'project_teams.csv',
        row: i + 2,
        field: 'teamName',
        message: `Unknown team "${pt.teamName}" (not in teams.csv)`,
        severity: 'error',
      });
      teamRefErrors++;
    }
  }
  console.log(`  ${teamRefErrors} referential errors`);

  // Validate project_values.csv
  console.log('Checking project_values.csv references...');
  let valueRefErrors = 0;
  for (let i = 0; i < projectValuesResult.data.length; i++) {
    const pv = projectValuesResult.data[i];

    if (!projectRefIds.has(pv.projectRefId)) {
      allErrors.push({
        file: 'project_values.csv',
        row: i + 2,
        field: 'projectRefId',
        message: `Unknown project "${pv.projectRefId}" (not in projects.csv)`,
        severity: 'error',
      });
      valueRefErrors++;
    }

    if (!outcomeSet.has(pv.outcomeName.toLowerCase())) {
      allErrors.push({
        file: 'project_values.csv',
        row: i + 2,
        field: 'outcomeName',
        message: `Unknown outcome "${pv.outcomeName}" (not in outcomes.csv)`,
        severity: 'error',
      });
      valueRefErrors++;
    }
  }
  console.log(`  ${valueRefErrors} referential errors`);

  // Validate project_impact.csv
  console.log('Checking project_impact.csv references...');
  let impactRefErrors = 0;
  for (let i = 0; i < projectImpactResult.data.length; i++) {
    const pi = projectImpactResult.data[i];

    if (!projectRefIds.has(pi.projectRefId)) {
      allErrors.push({
        file: 'project_impact.csv',
        row: i + 2,
        field: 'projectRefId',
        message: `Unknown project "${pi.projectRefId}" (not in projects.csv)`,
        severity: 'error',
      });
      impactRefErrors++;
    }

    if (!departmentSet.has(pi.departmentName.toLowerCase())) {
      allErrors.push({
        file: 'project_impact.csv',
        row: i + 2,
        field: 'departmentName',
        message: `Unknown department "${pi.departmentName}" (not in departments.csv)`,
        severity: 'error',
      });
      impactRefErrors++;
    }
  }
  console.log(`  ${impactRefErrors} referential errors`);

  // Validate budget.csv
  console.log('Checking budget.csv references...');
  let budgetRefErrors = 0;
  for (let i = 0; i < budgetsResult.data.length; i++) {
    const b = budgetsResult.data[i];

    if (!projectRefIds.has(b.projectRefId)) {
      allErrors.push({
        file: 'budget.csv',
        row: i + 2,
        field: 'projectRefId',
        message: `Unknown project "${b.projectRefId}" (not in projects.csv)`,
        severity: 'error',
      });
      budgetRefErrors++;
    }
  }
  console.log(`  ${budgetRefErrors} referential errors`);

  // Count errors by severity
  const errors = allErrors.filter((e) => e.severity === 'error');
  const warnings = allErrors.filter((e) => e.severity === 'warning');

  // Write validation report
  writeReport(join(STAGING_DIR, 'validation_report.md'), {
    title: 'Data Validation Report',
    timestamp: new Date().toISOString(),
    sourceFile: 'staging/*.csv',
    sections: [
      {
        title: 'Referentials Summary',
        items: [
          `Departments: ${departmentsResult.data.length}`,
          `Teams: ${teamsResult.data.length}`,
          `Statuses: ${statusesResult.data.length}`,
          `Outcomes: ${outcomesResult.data.length}`,
        ],
      },
      {
        title: 'Main Data Summary',
        items: [
          `Projects: ${projectsResult.data.length}`,
          `Team Assignments: ${projectTeamsResult.data.length}`,
          `Value Scores: ${projectValuesResult.data.length}`,
          `Change Impacts: ${projectImpactResult.data.length}`,
          `Budget Entries: ${budgetsResult.data.length}`,
        ],
      },
    ],
    warnings: errors.slice(0, 50).map((e) => `[${e.severity.toUpperCase()}] ${e.file}:${e.row} [${e.field}] ${e.message}`),
    summary: {
      'Total Rows': totalRows,
      'Schema Errors': errors.filter((e) => e.row > 0).length,
      'Referential Errors': errors.filter((e) => e.row > 0 && e.message.includes('not in')).length,
      'Warnings': warnings.length,
    },
  });

  console.log('\n--- Validation Summary ---');
  console.log(`Total rows validated: ${totalRows}`);
  console.log(`Errors found: ${errors.length}`);
  console.log(`Warnings found: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\nFirst 10 errors:');
    errors.slice(0, 10).forEach((e) => {
      console.log(`  ${e.file}:${e.row} [${e.field}] ${e.message}`);
    });
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more (see validation_report.md)`);
    }
  }

  const canProceed = errors.length === 0;

  if (canProceed) {
    console.log('\n✅ Validation passed! All CSVs are internally consistent.');
    console.log('Ready for load stage: npx tsx load.ts');
  } else {
    console.log('\n❌ Validation failed. Fix errors before loading.');
    console.log('See validation_report.md for details.');
  }

  process.exit(canProceed ? 0 : 1);
}

// CLI
const { values } = parseArgs({
  options: {
    help: { type: 'boolean', short: 'h' },
  },
});

if (values.help) {
  console.log(`
Usage: npx tsx validate.ts [options]

Options:
  -h, --help         Show this help message

The validate stage:
1. Validates schema compliance for all CSVs
2. Validates referential CSVs (departments, teams, statuses, outcomes)
3. Validates main data CSVs against referential CSVs
4. Reports any mismatches between CSVs

Requires: staging/*.csv files from extract stage

Input Files:
  Referentials:
    - departments.csv
    - teams.csv
    - statuses.csv
    - outcomes.csv

  Main Data:
    - projects.csv
    - project_teams.csv
    - project_values.csv
    - project_impact.csv
    - budget.csv
`);
  process.exit(0);
}

validate().catch((err) => {
  console.error('Validation failed:', err.message);
  process.exit(1);
});
