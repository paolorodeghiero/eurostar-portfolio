import { parseArgs } from 'node:util';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { readExcelSheet, readExcelByIndex, ExcelRow } from './lib/excel-reader.js';
import { writeCsv, writeReport } from './lib/csv-writer.js';
import { parseFlexibleDate } from './lib/date-parser.js';
import { mapStatus, mapTeamName, mapDepartmentName, mapEffortSize, mapImpactSize, mapOutcomeName } from './lib/mapping-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STAGING_DIR = join(__dirname, '../staging');

// Column indices (0-based, matching actual Excel structure)
const COL = {
  STATUS: 1,        // Status
  TEAM: 2,          // Team (lead team)
  REF_ID: 3,        // IS Portfolio Ref ID
  PROJECT_NAME: 4,  // Project
  DEPT_OWNER: 5,    // eurostar dpt Owner
  START_DATE: 6,    // Starting Date
  END_DATE: 8,      // Delivery Date
  // Value scores
  SAFETY: 13,       // Safety
  NPS: 14,          // NPS cust. Satisfaction
  EBITDA: 17,       // EBITDA
  REGULATORY: 18,   // Regulatory
  // IS Teams (effort) - columns 21-28
  TEAM_START: 21,
  TEAM_END: 28,
  // Change Impact departments - columns 32-42
  IMPACT_START: 32,
  IMPACT_END: 42,
  // People
  IS_OWNER: 48,     // Name of IS owner
  COMBOARD: 49,     // OK comBoard
  // Budget
  OPEX: 51,         // Opex IS Budget (full project)
  CAPEX: 52,        // Capex IS Budget (full project)
};

// Referential row types (new CSV files)
interface DepartmentRow {
  name: string;
}

interface TeamRefRow {
  name: string;
  departmentName: string;
}

interface StatusRow {
  name: string;
  color: string;
  displayOrder: number;
}

interface OutcomeRow {
  name: string;
}

// Main data row types
interface ProjectRow {
  rowNumber: number;
  refId: string;
  name: string;
  status: string;
  leadTeam: string;
  departmentOwner: string;
  startDate: string | null;
  endDate: string | null;
  isOwner: string;
  opexBudget: number;
  capexBudget: number;
}

interface ProjectTeamRow {
  projectRefId: string;
  teamName: string;
  effortSize: string;
  isLead: boolean;
}

interface ProjectValueRow {
  projectRefId: string;
  outcomeName: string;
  score: number | null;
}

interface ProjectImpactRow {
  projectRefId: string;
  departmentName: string;
  impactSize: string;
}

interface BudgetRow {
  projectRefId: string;
  opexAmount: number;
  capexAmount: number;
  currency: string;
}

async function extract(filePath: string): Promise<void> {
  console.log(`\nExtracting data from: ${filePath}`);
  console.log(`Output directory: ${STAGING_DIR}\n`);

  // Read Excel by index for positional access
  const rawData = readExcelByIndex(filePath, 'Input');

  if (rawData.length < 3) {
    console.error('No data rows found in Input sheet');
    process.exit(1);
  }

  // Row 0 is title, Row 1 is headers, Row 2+ is data
  const headerRow = rawData[1];
  const dataRows = rawData.slice(2);

  // Get team column names (columns 21-28)
  const teamColumnNames: string[] = [];
  for (let i = COL.TEAM_START; i <= COL.TEAM_END; i++) {
    teamColumnNames.push(headerRow[i]?.toString().trim() || `Team ${i - COL.TEAM_START + 1}`);
  }

  // Get impact department names (columns 32-42)
  const impactDeptColumnNames: string[] = [];
  for (let i = COL.IMPACT_START; i <= COL.IMPACT_END; i++) {
    impactDeptColumnNames.push(headerRow[i]?.toString().trim() || `Dept ${i - COL.IMPACT_START + 1}`);
  }

  // Collections for referentials (unique, mapped)
  const uniqueDepartments = new Set<string>();
  const uniqueTeams = new Map<string, string>(); // teamName -> departmentName
  const uniqueStatuses = new Set<string>();
  const uniqueOutcomes = new Set<string>();

  // Collections for main data
  const projects: ProjectRow[] = [];
  const projectTeams: ProjectTeamRow[] = [];
  const projectValues: ProjectValueRow[] = [];
  const projectImpact: ProjectImpactRow[] = [];
  const budgets: BudgetRow[] = [];
  const warnings: string[] = [];

  // Raw values for report (pre-mapping)
  const rawStatuses = new Set<string>();
  const rawTeams = new Set<string>();
  const rawDepartments = new Set<string>();

  // Pre-collect referentials from column headers
  // Teams from IS team columns (all teams belong to IS department)
  for (const rawTeamName of teamColumnNames) {
    const mappedTeam = mapTeamName(rawTeamName);
    if (mappedTeam) {
      uniqueTeams.set(mappedTeam, 'IS'); // IS teams belong to IS department
      rawTeams.add(rawTeamName);
    }
  }

  // Departments from impact columns
  for (const rawDeptName of impactDeptColumnNames) {
    const mappedDept = mapDepartmentName(rawDeptName);
    if (mappedDept) {
      uniqueDepartments.add(mappedDept);
      rawDepartments.add(rawDeptName);
    }
  }

  // Value outcomes are fixed columns
  const valueColumns = [
    { col: COL.SAFETY, rawName: 'Safety' },
    { col: COL.NPS, rawName: 'NPS' },
    { col: COL.EBITDA, rawName: 'EBITDA' },
    { col: COL.REGULATORY, rawName: 'Regulatory' },
  ];
  for (const { rawName } of valueColumns) {
    const mappedOutcome = mapOutcomeName(rawName);
    if (mappedOutcome) {
      uniqueOutcomes.add(mappedOutcome);
    }
  }

  // Process data rows
  let rowNum = 2; // Excel row number (accounting for title + header rows)
  for (const row of dataRows) {
    rowNum++;

    const refId = row[COL.REF_ID]?.toString().trim();
    const projectName = row[COL.PROJECT_NAME]?.toString().trim();

    // Skip empty rows
    if (!refId && !projectName) {
      continue;
    }

    // Warn about missing required fields
    if (!refId) {
      warnings.push(`Row ${rowNum}: Missing Ref ID for project "${projectName}" - using TBD`);
    }
    if (!projectName) {
      warnings.push(`Row ${rowNum}: Missing project name for Ref ID "${refId}" - using Unknown`);
    }

    const effectiveRefId = refId || `TBD-${rowNum}`;
    const effectiveName = projectName || 'Unknown Project';

    // Extract and map status
    const rawStatus = row[COL.STATUS]?.toString().trim() || '';
    const mappedStatus = mapStatus(rawStatus);
    rawStatuses.add(rawStatus || '(empty)');
    if (mappedStatus) {
      uniqueStatuses.add(mappedStatus);
    }

    // Extract and map lead team
    const rawLeadTeam = row[COL.TEAM]?.toString().trim() || '';
    const mappedLeadTeam = mapTeamName(rawLeadTeam);
    rawTeams.add(rawLeadTeam || '(empty)');
    if (mappedLeadTeam) {
      uniqueTeams.set(mappedLeadTeam, 'IS'); // Lead teams are IS teams
    }

    // Extract and map department owner
    const rawDeptOwner = row[COL.DEPT_OWNER]?.toString().trim() || '';
    const mappedDeptOwner = mapDepartmentName(rawDeptOwner);
    rawDepartments.add(rawDeptOwner || '(empty)');
    if (mappedDeptOwner) {
      uniqueDepartments.add(mappedDeptOwner);
    }

    // Parse dates
    const startDateRaw = row[COL.START_DATE];
    const endDateRaw = row[COL.END_DATE];
    const startDate = parseFlexibleDate(startDateRaw);
    const endDate = parseFlexibleDate(endDateRaw);

    if (startDateRaw && !startDate) {
      warnings.push(`Row ${rowNum}: Could not parse start date "${startDateRaw}"`);
    }
    if (endDateRaw && !endDate) {
      warnings.push(`Row ${rowNum}: Could not parse end date "${endDateRaw}"`);
    }

    // Parse budget amounts
    const opexRaw = row[COL.OPEX];
    const capexRaw = row[COL.CAPEX];
    const opexBudget = parseAmount(opexRaw);
    const capexBudget = parseAmount(capexRaw);

    // Add project row
    projects.push({
      rowNumber: rowNum,
      refId: effectiveRefId,
      name: effectiveName,
      status: mappedStatus,
      leadTeam: mappedLeadTeam,
      departmentOwner: mappedDeptOwner,
      startDate,
      endDate,
      isOwner: row[COL.IS_OWNER]?.toString().trim() || '',
      opexBudget,
      capexBudget,
    });

    // Extract team assignments
    // Lead team first
    if (mappedLeadTeam) {
      projectTeams.push({
        projectRefId: effectiveRefId,
        teamName: mappedLeadTeam,
        effortSize: 'M', // Default for lead team if no specific size
        isLead: true,
      });
    }

    // Other teams with effort sizes
    for (let i = 0; i < teamColumnNames.length; i++) {
      const effortValue = row[COL.TEAM_START + i]?.toString().trim().toUpperCase();
      if (effortValue && effortValue !== '' && effortValue !== '0') {
        const mappedSize = mapEffortSize(effortValue);
        if (mappedSize) {
          const mappedTeam = mapTeamName(teamColumnNames[i]);
          projectTeams.push({
            projectRefId: effectiveRefId,
            teamName: mappedTeam,
            effortSize: mappedSize,
            isLead: false,
          });
        }
      }
    }

    // Extract value scores
    for (const { col, rawName } of valueColumns) {
      const scoreRaw = row[col];
      const score = parseScore(scoreRaw);
      const mappedOutcome = mapOutcomeName(rawName);
      if (score !== null && mappedOutcome) {
        projectValues.push({
          projectRefId: effectiveRefId,
          outcomeName: mappedOutcome,
          score,
        });
      }
    }

    // Extract change impact
    for (let i = 0; i < impactDeptColumnNames.length; i++) {
      const impactValue = row[COL.IMPACT_START + i]?.toString().trim().toUpperCase();
      if (impactValue && impactValue !== '' && impactValue !== '0') {
        const mappedSize = mapImpactSize(impactValue);
        if (mappedSize) {
          const mappedDept = mapDepartmentName(impactDeptColumnNames[i]);
          projectImpact.push({
            projectRefId: effectiveRefId,
            departmentName: mappedDept,
            impactSize: mappedSize,
          });
        }
      }
    }

    // Extract budget
    if (opexBudget > 0 || capexBudget > 0) {
      budgets.push({
        projectRefId: effectiveRefId,
        opexAmount: opexBudget,
        capexAmount: capexBudget,
        currency: 'EUR', // Default currency
      });
    }
  }

  // Add IS department (parent of all teams)
  uniqueDepartments.add('IS');

  // Build referential CSV data
  const departmentRows: DepartmentRow[] = Array.from(uniqueDepartments)
    .sort()
    .map((name) => ({ name }));

  const teamRefRows: TeamRefRow[] = Array.from(uniqueTeams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, departmentName]) => ({ name, departmentName }));

  const statusRows: StatusRow[] = Array.from(uniqueStatuses)
    .sort()
    .map((name, index) => ({
      name,
      color: '#6b7280', // Default gray color
      displayOrder: index,
    }));

  const outcomeRows: OutcomeRow[] = Array.from(uniqueOutcomes)
    .sort()
    .map((name) => ({ name }));

  // Write CSV files
  console.log('Writing referential CSV files...');
  await writeCsv(join(STAGING_DIR, 'departments.csv'), departmentRows);
  console.log(`  - departments.csv: ${departmentRows.length} rows`);

  await writeCsv(join(STAGING_DIR, 'teams.csv'), teamRefRows);
  console.log(`  - teams.csv: ${teamRefRows.length} rows`);

  await writeCsv(join(STAGING_DIR, 'statuses.csv'), statusRows);
  console.log(`  - statuses.csv: ${statusRows.length} rows`);

  await writeCsv(join(STAGING_DIR, 'outcomes.csv'), outcomeRows);
  console.log(`  - outcomes.csv: ${outcomeRows.length} rows`);

  console.log('\nWriting main data CSV files...');
  await writeCsv(join(STAGING_DIR, 'projects.csv'), projects);
  console.log(`  - projects.csv: ${projects.length} rows`);

  await writeCsv(join(STAGING_DIR, 'project_teams.csv'), projectTeams);
  console.log(`  - project_teams.csv: ${projectTeams.length} rows`);

  await writeCsv(join(STAGING_DIR, 'project_values.csv'), projectValues);
  console.log(`  - project_values.csv: ${projectValues.length} rows`);

  await writeCsv(join(STAGING_DIR, 'project_impact.csv'), projectImpact);
  console.log(`  - project_impact.csv: ${projectImpact.length} rows`);

  await writeCsv(join(STAGING_DIR, 'budget.csv'), budgets);
  console.log(`  - budget.csv: ${budgets.length} rows`);

  // Write report
  writeReport(join(STAGING_DIR, 'extraction_report.md'), {
    title: 'Data Extraction Report',
    timestamp: new Date().toISOString(),
    sourceFile: basename(filePath),
    sections: [
      {
        title: 'Raw Statuses Found (pre-mapping)',
        items: Array.from(rawStatuses).sort(),
      },
      {
        title: 'Mapped Statuses',
        items: Array.from(uniqueStatuses).sort(),
      },
      {
        title: 'Raw Teams Found (pre-mapping)',
        items: Array.from(rawTeams).sort(),
      },
      {
        title: 'Mapped Teams',
        items: Array.from(uniqueTeams.keys()).sort(),
      },
      {
        title: 'Raw Departments Found (pre-mapping)',
        items: Array.from(rawDepartments).sort(),
      },
      {
        title: 'Mapped Departments',
        items: Array.from(uniqueDepartments).sort(),
      },
      {
        title: 'Mapped Outcomes',
        items: Array.from(uniqueOutcomes).sort(),
      },
    ],
    warnings,
    summary: {
      'Departments': departmentRows.length,
      'Teams': teamRefRows.length,
      'Statuses': statusRows.length,
      'Outcomes': outcomeRows.length,
      'Projects': projects.length,
      'Project Team Assignments': projectTeams.length,
      'Project Value Scores': projectValues.length,
      'Project Change Impact': projectImpact.length,
      'Budget Entries': budgets.length,
    },
  });
  console.log(`\n  - extraction_report.md`);

  console.log(`\nExtraction complete! ${warnings.length} warnings.`);
  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.slice(0, 10).forEach((w) => console.log(`  - ${w}`));
    if (warnings.length > 10) {
      console.log(`  ... and ${warnings.length - 10} more (see extraction_report.md)`);
    }
  }
}

function parseAmount(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : num;
}

function parseScore(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : parseInt(value.toString(), 10);
  if (isNaN(num)) return null;
  // Clamp to 1-5 range
  return Math.max(1, Math.min(5, num));
}

// CLI
const { values, positionals } = parseArgs({
  options: {
    file: { type: 'string', short: 'f' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
});

if (values.help) {
  console.log(`
Usage: npx tsx extract.ts [options] [file]

Options:
  -f, --file <path>  Path to Excel file (default: import/source/TPO Portfolio.xlsx)
  -h, --help         Show this help message

Output Files (staging/):
  Referentials:
    - departments.csv   Unique departments
    - teams.csv         Unique teams with department links
    - statuses.csv      Unique statuses with colors
    - outcomes.csv      Unique value outcomes

  Main Data:
    - projects.csv       Project records
    - project_teams.csv  Team assignments per project
    - project_values.csv Value scores per project
    - project_impact.csv Change impact per project
    - budget.csv         Budget entries

Examples:
  npx tsx extract.ts
  npx tsx extract.ts -f "path/to/file.xlsx"
  npx tsx extract.ts "TPO Portfolio.xlsx"
  `);
  process.exit(0);
}

const filePath = values.file || positionals[0] || join(__dirname, '../source', 'TPO Portfolio.xlsx');

extract(filePath).catch((err) => {
  console.error('Extraction failed:', err.message);
  process.exit(1);
});
