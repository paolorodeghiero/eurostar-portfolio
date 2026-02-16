import { parseArgs } from 'node:util';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { parseFile } from '@fast-csv/parse';
import { eq, sql } from 'drizzle-orm';
import { db, pool } from '../../src/db/index.js';
import {
  projects,
  projectTeams,
  projectValues,
  projectChangeImpact,
  teams,
  statuses,
  outcomes,
  departments,
} from '../../src/db/schema.js';
import {
  resolveConflict,
  findChangedFields,
  closeReadline,
  resetGlobalResolution,
} from './lib/conflict-resolver.js';
import { writeReport } from './lib/csv-writer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STAGING_DIR = join(__dirname, '../staging');

interface LoadStats {
  departmentsCreated: number;
  departmentsSkipped: number;
  teamsCreated: number;
  teamsSkipped: number;
  statusesCreated: number;
  statusesSkipped: number;
  outcomesCreated: number;
  outcomesSkipped: number;
  projectsCreated: number;
  projectsUpdated: number;
  projectsSkipped: number;
  projectTeamsCreated: number;
  projectTeamsSkipped: number;
  projectValuesCreated: number;
  projectValuesSkipped: number;
  projectImpactCreated: number;
  projectImpactSkipped: number;
  errors: string[];
}

async function parseCsv<T>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const data: T[] = [];
    parseFile(filePath, { headers: true })
      .on('data', (row) => data.push(row as T))
      .on('end', () => resolve(data))
      .on('error', reject);
  });
}

async function load(options: { dryRun: boolean; sourceFile: string }): Promise<void> {
  console.log(`\nLoading data to database...`);
  console.log(`Dry run: ${options.dryRun ? 'YES (no changes will be made)' : 'NO (changes will be saved)'}\n`);

  resetGlobalResolution();

  const stats: LoadStats = {
    departmentsCreated: 0,
    departmentsSkipped: 0,
    teamsCreated: 0,
    teamsSkipped: 0,
    statusesCreated: 0,
    statusesSkipped: 0,
    outcomesCreated: 0,
    outcomesSkipped: 0,
    projectsCreated: 0,
    projectsUpdated: 0,
    projectsSkipped: 0,
    projectTeamsCreated: 0,
    projectTeamsSkipped: 0,
    projectValuesCreated: 0,
    projectValuesSkipped: 0,
    projectImpactCreated: 0,
    projectImpactSkipped: 0,
    errors: [],
  };

  // ===== PHASE 1: Load all CSV files =====
  console.log('--- Phase 1: Loading CSV files ---\n');

  const departmentRows = await parseCsv<{ name: string }>(join(STAGING_DIR, 'departments.csv'));
  const teamRefRows = await parseCsv<{ name: string; departmentName: string }>(join(STAGING_DIR, 'teams.csv'));
  const statusRows = await parseCsv<{ name: string; color: string; displayOrder: string }>(join(STAGING_DIR, 'statuses.csv'));
  const outcomeRows = await parseCsv<{ name: string }>(join(STAGING_DIR, 'outcomes.csv'));
  const projectRows = await parseCsv<any>(join(STAGING_DIR, 'projects.csv'));
  const projectTeamRows = await parseCsv<any>(join(STAGING_DIR, 'project_teams.csv'));
  const projectValueRows = await parseCsv<any>(join(STAGING_DIR, 'project_values.csv'));
  const projectImpactRows = await parseCsv<any>(join(STAGING_DIR, 'project_impact.csv'));

  console.log('Loaded CSV files:');
  console.log(`  Referentials: ${departmentRows.length} departments, ${teamRefRows.length} teams, ${statusRows.length} statuses, ${outcomeRows.length} outcomes`);
  console.log(`  Main data: ${projectRows.length} projects, ${projectTeamRows.length} team assignments`);
  console.log(`             ${projectValueRows.length} value scores, ${projectImpactRows.length} change impacts\n`);

  // ===== PHASE 2: Insert referentials in FK order =====
  console.log('--- Phase 2: Inserting referentials (FK order) ---\n');

  // 2a. Departments (no dependencies)
  console.log('Inserting departments...');
  const departmentMap = new Map<string, number>(); // name (lowercase) -> id
  const existingDepts = await db.select().from(departments);
  for (const d of existingDepts) {
    departmentMap.set(d.name.toLowerCase(), d.id);
  }

  for (const row of departmentRows) {
    const key = row.name.toLowerCase();
    if (departmentMap.has(key)) {
      stats.departmentsSkipped++;
    } else if (!options.dryRun) {
      const [newDept] = await db.insert(departments).values({ name: row.name }).returning();
      departmentMap.set(key, newDept.id);
      console.log(`  [CREATE] Department: ${row.name}`);
      stats.departmentsCreated++;
    } else {
      console.log(`  [DRY-RUN] Would create department: ${row.name}`);
      stats.departmentsCreated++;
    }
  }
  console.log(`  Done: ${stats.departmentsCreated} created, ${stats.departmentsSkipped} skipped\n`);

  // 2b. Teams (depends on departments)
  console.log('Inserting teams...');
  const teamMap = new Map<string, number>(); // name (lowercase) -> id
  const existingTeams = await db.select().from(teams);
  for (const t of existingTeams) {
    teamMap.set(t.name.toLowerCase(), t.id);
  }

  for (const row of teamRefRows) {
    const key = row.name.toLowerCase();
    if (teamMap.has(key)) {
      stats.teamsSkipped++;
    } else {
      const deptId = departmentMap.get(row.departmentName.toLowerCase());
      if (!deptId) {
        stats.errors.push(`Team "${row.name}": Unknown department "${row.departmentName}"`);
        continue;
      }
      if (!options.dryRun) {
        const [newTeam] = await db.insert(teams).values({
          name: row.name,
          description: 'Imported from TPO Portfolio',
          departmentId: deptId,
        }).returning();
        teamMap.set(key, newTeam.id);
        console.log(`  [CREATE] Team: ${row.name} (dept: ${row.departmentName})`);
        stats.teamsCreated++;
      } else {
        console.log(`  [DRY-RUN] Would create team: ${row.name}`);
        stats.teamsCreated++;
      }
    }
  }
  console.log(`  Done: ${stats.teamsCreated} created, ${stats.teamsSkipped} skipped\n`);

  // 2c. Statuses (no dependencies)
  console.log('Inserting statuses...');
  const statusMap = new Map<string, number>(); // name (lowercase) -> id
  const existingStatuses = await db.select().from(statuses);
  for (const s of existingStatuses) {
    statusMap.set(s.name.toLowerCase(), s.id);
  }

  for (const row of statusRows) {
    const key = row.name.toLowerCase();
    if (statusMap.has(key)) {
      stats.statusesSkipped++;
    } else if (!options.dryRun) {
      const [newStatus] = await db.insert(statuses).values({
        name: row.name,
        color: row.color,
        displayOrder: parseInt(row.displayOrder, 10),
      }).returning();
      statusMap.set(key, newStatus.id);
      console.log(`  [CREATE] Status: ${row.name}`);
      stats.statusesCreated++;
    } else {
      console.log(`  [DRY-RUN] Would create status: ${row.name}`);
      stats.statusesCreated++;
    }
  }
  console.log(`  Done: ${stats.statusesCreated} created, ${stats.statusesSkipped} skipped\n`);

  // 2d. Outcomes (no dependencies)
  console.log('Inserting outcomes...');
  const outcomeMap = new Map<string, number>(); // name (lowercase) -> id
  const existingOutcomes = await db.select().from(outcomes);
  for (const o of existingOutcomes) {
    outcomeMap.set(o.name.toLowerCase(), o.id);
  }

  for (const row of outcomeRows) {
    const key = row.name.toLowerCase();
    if (outcomeMap.has(key)) {
      stats.outcomesSkipped++;
    } else if (!options.dryRun) {
      const [newOutcome] = await db.insert(outcomes).values({
        name: row.name,
        score1Example: 'No impact',
        score2Example: 'Minor impact',
        score3Example: 'Moderate impact',
        score4Example: 'Significant impact',
        score5Example: 'Major impact',
      }).returning();
      outcomeMap.set(key, newOutcome.id);
      console.log(`  [CREATE] Outcome: ${row.name}`);
      stats.outcomesCreated++;
    } else {
      console.log(`  [DRY-RUN] Would create outcome: ${row.name}`);
      stats.outcomesCreated++;
    }
  }
  console.log(`  Done: ${stats.outcomesCreated} created, ${stats.outcomesSkipped} skipped\n`);

  // ===== PHASE 3: Insert main entities =====
  console.log('--- Phase 3: Inserting main entities ---\n');

  // Build lookup maps for child entities
  const projectTeamsByRefId = new Map<string, any[]>();
  for (const row of projectTeamRows) {
    const list = projectTeamsByRefId.get(row.projectRefId) || [];
    list.push(row);
    projectTeamsByRefId.set(row.projectRefId, list);
  }

  const projectValuesByRefId = new Map<string, any[]>();
  for (const row of projectValueRows) {
    const list = projectValuesByRefId.get(row.projectRefId) || [];
    list.push(row);
    projectValuesByRefId.set(row.projectRefId, list);
  }

  const projectImpactByRefId = new Map<string, any[]>();
  for (const row of projectImpactRows) {
    const list = projectImpactByRefId.get(row.projectRefId) || [];
    list.push(row);
    projectImpactByRefId.set(row.projectRefId, list);
  }

  // 3a. Projects
  console.log('Inserting projects...');
  const projectIdMap = new Map<string, number>(); // refId -> id
  const BATCH_SIZE = 50;
  let processed = 0;

  for (const row of projectRows) {
    processed++;
    const refId = row.refId;

    try {
      // Resolve FKs
      const leadTeamId = teamMap.get(row.leadTeam?.toLowerCase());
      const statusId = statusMap.get(row.status?.toLowerCase());

      if (!statusId) {
        stats.errors.push(`${refId}: Unknown status "${row.status}"`);
        stats.projectsSkipped++;
        continue;
      }

      if (row.leadTeam && !leadTeamId) {
        stats.errors.push(`${refId}: Unknown lead team "${row.leadTeam}"`);
        stats.projectsSkipped++;
        continue;
      }

      // Check if project exists
      const [existing] = await db
        .select()
        .from(projects)
        .where(eq(projects.projectId, refId));

      const projectData = {
        projectId: refId,
        name: row.name,
        statusId,
        leadTeamId: leadTeamId || null,
        startDate: row.startDate || null,
        endDate: row.endDate || null,
        projectManager: row.isOwner || null,
        isOwner: row.isOwner || null,
        opexBudget: row.opexBudget?.toString() || '0',
        capexBudget: row.capexBudget?.toString() || '0',
        budgetCurrency: 'EUR',
        importedAt: new Date(),
        importSource: options.sourceFile,
      };

      if (existing) {
        // Conflict resolution
        const fieldsToCompare = ['name', 'statusId', 'leadTeamId', 'startDate', 'endDate', 'opexBudget', 'capexBudget', 'budgetCurrency'];
        const changedFields = findChangedFields(
          {
            name: existing.name,
            statusId: existing.statusId,
            leadTeamId: existing.leadTeamId,
            startDate: existing.startDate,
            endDate: existing.endDate,
            opexBudget: existing.opexBudget,
            capexBudget: existing.capexBudget,
            budgetCurrency: existing.budgetCurrency,
          },
          projectData,
          fieldsToCompare
        );

        if (changedFields.length === 0) {
          console.log(`  [SKIP] ${refId}: No changes`);
          stats.projectsSkipped++;
          projectIdMap.set(refId, existing.id);
        } else {
          const resolution = await resolveConflict({
            projectRefId: refId,
            projectName: row.name,
            existing: {
              name: existing.name,
              statusId: existing.statusId,
              leadTeamId: existing.leadTeamId,
              startDate: existing.startDate,
              endDate: existing.endDate,
              opexBudget: existing.opexBudget,
              capexBudget: existing.capexBudget,
              budgetCurrency: existing.budgetCurrency,
            },
            incoming: projectData,
            fieldsChanged: changedFields,
          });

          if (resolution === 'skip') {
            console.log(`  [SKIP] ${refId}: User skipped`);
            stats.projectsSkipped++;
            projectIdMap.set(refId, existing.id);
          } else if (!options.dryRun) {
            if (resolution === 'update') {
              const updateData: any = { updatedAt: new Date() };
              for (const field of changedFields) {
                updateData[field] = (projectData as any)[field];
              }
              updateData.importedAt = new Date();
              updateData.importSource = options.sourceFile;

              await db.update(projects).set(updateData).where(eq(projects.id, existing.id));
              console.log(`  [UPDATE] ${refId}: ${changedFields.join(', ')}`);
              stats.projectsUpdated++;
              projectIdMap.set(refId, existing.id);
            } else if (resolution === 'overwrite') {
              await db.update(projects).set({
                ...projectData,
                updatedAt: new Date(),
              }).where(eq(projects.id, existing.id));
              console.log(`  [OVERWRITE] ${refId}`);
              stats.projectsUpdated++;
              projectIdMap.set(refId, existing.id);
            }
          } else {
            console.log(`  [DRY-RUN] Would ${resolution} ${refId}`);
            stats.projectsUpdated++;
            projectIdMap.set(refId, existing.id);
          }
        }
      } else {
        // New project
        if (!options.dryRun) {
          const [newProject] = await db.insert(projects).values(projectData).returning();
          console.log(`  [CREATE] ${refId}: ${row.name}`);
          stats.projectsCreated++;
          projectIdMap.set(refId, newProject.id);
        } else {
          console.log(`  [DRY-RUN] Would create ${refId}: ${row.name}`);
          stats.projectsCreated++;
          // Use placeholder ID for dry-run
          projectIdMap.set(refId, -1);
        }
      }
    } catch (error: any) {
      stats.errors.push(`${refId}: ${error.message}`);
      console.error(`  [ERROR] ${refId}: ${error.message}`);
    }

    // Progress indicator
    if (processed % BATCH_SIZE === 0) {
      console.log(`\n  Progress: ${processed}/${projectRows.length} projects\n`);
    }
  }
  console.log(`  Done: ${stats.projectsCreated} created, ${stats.projectsUpdated} updated, ${stats.projectsSkipped} skipped\n`);

  // 3b. Project Teams
  console.log('Inserting project team assignments...');
  for (const [refId, assignments] of projectTeamsByRefId) {
    const projectId = projectIdMap.get(refId);
    if (!projectId || projectId === -1) continue;

    for (const row of assignments) {
      const teamId = teamMap.get(row.teamName?.toLowerCase());
      if (!teamId) continue;

      // Check if already exists
      const [existing] = await db
        .select()
        .from(projectTeams)
        .where(eq(projectTeams.projectId, projectId))
        .where(eq(projectTeams.teamId, teamId));

      if (!existing && !options.dryRun) {
        await db.insert(projectTeams).values({
          projectId,
          teamId,
          effortSize: row.effortSize,
          isLead: row.isLead === 'true',
        });
        stats.projectTeamsCreated++;
      } else if (!existing) {
        stats.projectTeamsCreated++;
      } else {
        stats.projectTeamsSkipped++;
      }
    }
  }
  console.log(`  Done: ${stats.projectTeamsCreated} created, ${stats.projectTeamsSkipped} skipped\n`);

  // 3c. Project Values
  console.log('Inserting project value scores...');
  for (const [refId, values] of projectValuesByRefId) {
    const projectId = projectIdMap.get(refId);
    if (!projectId || projectId === -1) continue;

    for (const row of values) {
      const outcomeId = outcomeMap.get(row.outcomeName?.toLowerCase());
      if (!outcomeId) continue;

      const [existing] = await db
        .select()
        .from(projectValues)
        .where(eq(projectValues.projectId, projectId))
        .where(eq(projectValues.outcomeId, outcomeId));

      if (!existing && !options.dryRun) {
        await db.insert(projectValues).values({
          projectId,
          outcomeId,
          score: parseInt(row.score, 10),
        });
        stats.projectValuesCreated++;
      } else if (!existing) {
        stats.projectValuesCreated++;
      } else {
        stats.projectValuesSkipped++;
      }
    }
  }
  console.log(`  Done: ${stats.projectValuesCreated} created, ${stats.projectValuesSkipped} skipped\n`);

  // 3d. Project Change Impact
  console.log('Inserting project change impacts...');
  for (const [refId, impacts] of projectImpactByRefId) {
    const projectId = projectIdMap.get(refId);
    if (!projectId || projectId === -1) continue;

    for (const row of impacts) {
      // Change impact references departments, but uses teamId in schema
      // Need to find team by department name (or adjust schema)
      // For now, try to find a team with matching name
      const teamId = teamMap.get(row.departmentName?.toLowerCase());
      if (!teamId) {
        // If no team matches, skip (this is intentional - impact should reference existing teams)
        continue;
      }

      const [existing] = await db
        .select()
        .from(projectChangeImpact)
        .where(eq(projectChangeImpact.projectId, projectId))
        .where(eq(projectChangeImpact.teamId, teamId));

      if (!existing && !options.dryRun) {
        await db.insert(projectChangeImpact).values({
          projectId,
          teamId,
          impactSize: row.impactSize,
        });
        stats.projectImpactCreated++;
      } else if (!existing) {
        stats.projectImpactCreated++;
      } else {
        stats.projectImpactSkipped++;
      }
    }
  }
  console.log(`  Done: ${stats.projectImpactCreated} created, ${stats.projectImpactSkipped} skipped\n`);

  closeReadline();

  // Write load report
  writeReport(join(STAGING_DIR, 'load_report.md'), {
    title: 'Data Load Report',
    timestamp: new Date().toISOString(),
    sourceFile: options.sourceFile,
    sections: [
      {
        title: 'Referentials Loaded',
        items: [
          `Departments: ${stats.departmentsCreated} created, ${stats.departmentsSkipped} skipped`,
          `Teams: ${stats.teamsCreated} created, ${stats.teamsSkipped} skipped`,
          `Statuses: ${stats.statusesCreated} created, ${stats.statusesSkipped} skipped`,
          `Outcomes: ${stats.outcomesCreated} created, ${stats.outcomesSkipped} skipped`,
        ],
      },
      {
        title: 'Main Data Loaded',
        items: [
          `Projects: ${stats.projectsCreated} created, ${stats.projectsUpdated} updated, ${stats.projectsSkipped} skipped`,
          `Team Assignments: ${stats.projectTeamsCreated} created, ${stats.projectTeamsSkipped} skipped`,
          `Value Scores: ${stats.projectValuesCreated} created, ${stats.projectValuesSkipped} skipped`,
          `Change Impacts: ${stats.projectImpactCreated} created, ${stats.projectImpactSkipped} skipped`,
        ],
      },
    ],
    warnings: stats.errors,
    summary: {
      'Departments Created': stats.departmentsCreated,
      'Teams Created': stats.teamsCreated,
      'Statuses Created': stats.statusesCreated,
      'Outcomes Created': stats.outcomesCreated,
      'Projects Created': stats.projectsCreated,
      'Projects Updated': stats.projectsUpdated,
      'Errors': stats.errors.length,
    },
  });

  console.log('--- Load Summary ---');
  console.log('Referentials:');
  console.log(`  Departments: ${stats.departmentsCreated} created, ${stats.departmentsSkipped} skipped`);
  console.log(`  Teams: ${stats.teamsCreated} created, ${stats.teamsSkipped} skipped`);
  console.log(`  Statuses: ${stats.statusesCreated} created, ${stats.statusesSkipped} skipped`);
  console.log(`  Outcomes: ${stats.outcomesCreated} created, ${stats.outcomesSkipped} skipped`);
  console.log('\nMain Data:');
  console.log(`  Projects: ${stats.projectsCreated} created, ${stats.projectsUpdated} updated, ${stats.projectsSkipped} skipped`);
  console.log(`  Team Assignments: ${stats.projectTeamsCreated} created`);
  console.log(`  Value Scores: ${stats.projectValuesCreated} created`);
  console.log(`  Change Impacts: ${stats.projectImpactCreated} created`);
  console.log(`\nErrors: ${stats.errors.length}`);

  if (options.dryRun) {
    console.log('\n[DRY RUN] No changes were made to the database.');
  } else {
    console.log('\n✅ Load complete!');
  }

  await pool.end();
}

// CLI
const { values, positionals } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', short: 'd' },
    source: { type: 'string', short: 's' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
});

if (values.help) {
  console.log(`
Usage: npx tsx load.ts [options]

Options:
  -d, --dry-run       Show what would be imported without making changes
  -s, --source <name> Source file name for import tracking (default: "TPO Portfolio.xlsx")
  -h, --help          Show this help message

The load stage inserts data in FK order:
1. Referentials: departments -> teams -> statuses -> outcomes
2. Main data: projects -> project_teams -> project_values -> project_impact

For existing projects, prompts for conflict resolution:
  - Update: merge only changed fields
  - Overwrite: replace all fields
  - Skip: keep existing data

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

Requires: Successful validate stage (npx tsx validate.ts)
  `);
  process.exit(0);
}

// Check all required staging files exist
const referentialFiles = ['departments.csv', 'teams.csv', 'statuses.csv', 'outcomes.csv'];
const mainDataFiles = ['projects.csv', 'project_teams.csv', 'project_values.csv', 'project_impact.csv'];
const allRequiredFiles = [...referentialFiles, ...mainDataFiles];

for (const file of allRequiredFiles) {
  if (!existsSync(join(STAGING_DIR, file))) {
    console.error(`Missing file: ${file}`);
    console.error('Run extract and validate stages first.');
    process.exit(1);
  }
}

load({
  dryRun: values['dry-run'] ?? false,
  sourceFile: values.source || 'TPO Portfolio.xlsx',
}).catch((err) => {
  console.error('Load failed:', err.message);
  closeReadline();
  process.exit(1);
});
