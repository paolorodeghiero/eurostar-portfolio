import { parseArgs } from 'node:util';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { readExcelSheet, readExcelByIndex, ExcelRow } from './lib/excel-reader.js';
import { writeCsv, writeReport } from './lib/csv-writer.js';
import { parseFlexibleDate } from './lib/date-parser.js';
import { mapStatus, mapTeamName, mapDepartmentName, mapEffortSize, mapImpactSize } from './lib/mapping-loader.js';

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
  sponsor: string;
  opexBudget: number;
  capexBudget: number;
}

interface TeamRow {
  projectRefId: string;
  teamName: string;
  effortSize: string;
  isLead: boolean;
}

interface ValueScoreRow {
  projectRefId: string;
  outcomeName: string;
  score: number | null;
}

interface ChangeImpactRow {
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
  const teamNames: string[] = [];
  for (let i = COL.TEAM_START; i <= COL.TEAM_END; i++) {
    teamNames.push(headerRow[i]?.toString().trim() || `Team ${i - COL.TEAM_START + 1}`);
  }

  // Get impact department names (columns 32-42)
  const impactDeptNames: string[] = [];
  for (let i = COL.IMPACT_START; i <= COL.IMPACT_END; i++) {
    impactDeptNames.push(headerRow[i]?.toString().trim() || `Dept ${i - COL.IMPACT_START + 1}`);
  }

  const projects: ProjectRow[] = [];
  const teams: TeamRow[] = [];
  const valueScores: ValueScoreRow[] = [];
  const changeImpact: ChangeImpactRow[] = [];
  const budgets: BudgetRow[] = [];
  const warnings: string[] = [];

  // Track unique values for report
  const uniqueStatuses = new Set<string>();
  const uniqueTeams = new Set<string>();
  const uniqueDepartments = new Set<string>();

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

    // Extract project data
    const rawStatus = row[COL.STATUS]?.toString().trim() || '';
    const mappedStatus = mapStatus(rawStatus);
    uniqueStatuses.add(rawStatus || '(empty)');

    const leadTeam = row[COL.TEAM]?.toString().trim() || '';
    uniqueTeams.add(leadTeam || '(empty)');

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

    projects.push({
      rowNumber: rowNum,
      refId: effectiveRefId,
      name: effectiveName,
      status: mappedStatus,
      leadTeam: mapTeamName(leadTeam),
      departmentOwner: mapDepartmentName(row[COL.DEPT_OWNER]?.toString().trim() || ''),
      startDate,
      endDate,
      isOwner: row[COL.IS_OWNER]?.toString().trim() || '',
      sponsor: row[COL.COMBOARD]?.toString().trim() || '',
      opexBudget,
      capexBudget,
    });

    // Extract team effort (8 IS teams)
    // Lead team first
    if (leadTeam) {
      teams.push({
        projectRefId: effectiveRefId,
        teamName: mapTeamName(leadTeam),
        effortSize: 'M', // Default for lead team if no specific size
        isLead: true,
      });
    }

    // Other teams with effort sizes
    for (let i = 0; i < teamNames.length; i++) {
      const effortValue = row[COL.TEAM_START + i]?.toString().trim().toUpperCase();
      if (effortValue && effortValue !== '' && effortValue !== '0') {
        const mappedSize = mapEffortSize(effortValue);
        if (mappedSize) {
          teams.push({
            projectRefId: effectiveRefId,
            teamName: mapTeamName(teamNames[i]),
            effortSize: mappedSize,
            isLead: false,
          });
          uniqueTeams.add(teamNames[i]);
        }
      }
    }

    // Extract value scores
    const valueColumns = [
      { col: COL.SAFETY, name: 'Safety' },
      { col: COL.NPS, name: 'NPS' },
      { col: COL.EBITDA, name: 'EBITDA' },
      { col: COL.REGULATORY, name: 'Regulatory' },
    ];

    for (const { col, name } of valueColumns) {
      const scoreRaw = row[col];
      const score = parseScore(scoreRaw);
      if (score !== null) {
        valueScores.push({
          projectRefId: effectiveRefId,
          outcomeName: name,
          score,
        });
      }
    }

    // Extract change impact (11 departments)
    for (let i = 0; i < impactDeptNames.length; i++) {
      const impactValue = row[COL.IMPACT_START + i]?.toString().trim().toUpperCase();
      if (impactValue && impactValue !== '' && impactValue !== '0') {
        const mappedSize = mapImpactSize(impactValue);
        if (mappedSize) {
          changeImpact.push({
            projectRefId: effectiveRefId,
            departmentName: mapDepartmentName(impactDeptNames[i]),
            impactSize: mappedSize,
          });
          uniqueDepartments.add(impactDeptNames[i]);
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

  // Write CSV files
  console.log('Writing CSV files...');
  await writeCsv(join(STAGING_DIR, 'projects.csv'), projects);
  console.log(`  - projects.csv: ${projects.length} rows`);

  await writeCsv(join(STAGING_DIR, 'teams.csv'), teams);
  console.log(`  - teams.csv: ${teams.length} rows`);

  await writeCsv(join(STAGING_DIR, 'value_scores.csv'), valueScores);
  console.log(`  - value_scores.csv: ${valueScores.length} rows`);

  await writeCsv(join(STAGING_DIR, 'change_impact.csv'), changeImpact);
  console.log(`  - change_impact.csv: ${changeImpact.length} rows`);

  await writeCsv(join(STAGING_DIR, 'budget.csv'), budgets);
  console.log(`  - budget.csv: ${budgets.length} rows`);

  // Write report
  writeReport(join(STAGING_DIR, 'extraction_report.md'), {
    title: 'Data Extraction Report',
    timestamp: new Date().toISOString(),
    sourceFile: basename(filePath),
    sections: [
      {
        title: 'Unique Statuses Found',
        items: Array.from(uniqueStatuses).sort(),
      },
      {
        title: 'Unique Teams Found',
        items: Array.from(uniqueTeams).sort(),
      },
      {
        title: 'Unique Departments Found',
        items: Array.from(uniqueDepartments).sort(),
      },
    ],
    warnings,
    summary: {
      Projects: projects.length,
      'Team Assignments': teams.length,
      'Value Scores': valueScores.length,
      'Change Impact Entries': changeImpact.length,
      'Budget Entries': budgets.length,
    },
  });
  console.log(`  - extraction_report.md`);

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
  -f, --file <path>  Path to Excel file (default: TPO Portfolio.xlsx)
  -h, --help         Show this help message

Examples:
  npx tsx extract.ts
  npx tsx extract.ts -f "path/to/file.xlsx"
  npx tsx extract.ts "TPO Portfolio.xlsx"
  `);
  process.exit(0);
}

const filePath = values.file || positionals[0] || join(__dirname, '../../../..', 'TPO Portfolio.xlsx');

extract(filePath).catch((err) => {
  console.error('Extraction failed:', err.message);
  process.exit(1);
});
