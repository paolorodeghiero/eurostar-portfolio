import { parseArgs } from 'node:util';
import { join, dirname, basename } from 'path';
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
import { shouldAutoCreateMissing } from './lib/mapping-loader.js';
import { writeReport } from './lib/csv-writer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STAGING_DIR = join(__dirname, '../staging');

interface LoadStats {
  projectsCreated: number;
  projectsUpdated: number;
  projectsSkipped: number;
  teamsCreated: number;
  teamsSkipped: number;
  valuesCreated: number;
  valuesSkipped: number;
  impactCreated: number;
  impactSkipped: number;
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
    projectsCreated: 0,
    projectsUpdated: 0,
    projectsSkipped: 0,
    teamsCreated: 0,
    teamsSkipped: 0,
    valuesCreated: 0,
    valuesSkipped: 0,
    impactCreated: 0,
    impactSkipped: 0,
    errors: [],
  };

  // Load lookup tables
  const statusList = await db.select().from(statuses);
  const statusMap = new Map(statusList.map((s) => [s.name.toLowerCase(), s.id]));

  const teamList = await db.select().from(teams);
  const teamMap = new Map(teamList.map((t) => [t.name.toLowerCase(), t.id]));

  const outcomeList = await db.select().from(outcomes);
  const outcomeMap = new Map(outcomeList.map((o) => [o.name.toLowerCase(), o.id]));

  const deptList = await db.select().from(departments);
  const deptMap = new Map(deptList.map((d) => [d.name.toLowerCase(), d.id]));

  // Parse CSV files
  const projectRows = await parseCsv<any>(join(STAGING_DIR, 'projects.csv'));
  const teamRows = await parseCsv<any>(join(STAGING_DIR, 'teams.csv'));
  const valueRows = await parseCsv<any>(join(STAGING_DIR, 'value_scores.csv'));
  const impactRows = await parseCsv<any>(join(STAGING_DIR, 'change_impact.csv'));

  console.log(`Loaded: ${projectRows.length} projects, ${teamRows.length} team assignments`);
  console.log(`        ${valueRows.length} value scores, ${impactRows.length} change impacts\n`);

  // Build lookup for child entities
  const teamsByProject = new Map<string, any[]>();
  for (const row of teamRows) {
    const list = teamsByProject.get(row.projectRefId) || [];
    list.push(row);
    teamsByProject.set(row.projectRefId, list);
  }

  const valuesByProject = new Map<string, any[]>();
  for (const row of valueRows) {
    const list = valuesByProject.get(row.projectRefId) || [];
    list.push(row);
    valuesByProject.set(row.projectRefId, list);
  }

  const impactByProject = new Map<string, any[]>();
  for (const row of impactRows) {
    const list = impactByProject.get(row.projectRefId) || [];
    list.push(row);
    impactByProject.set(row.projectRefId, list);
  }

  // Process projects
  const BATCH_SIZE = 50;
  let processed = 0;

  for (const row of projectRows) {
    processed++;
    const refId = row.refId;

    try {
      // Check if project exists
      const [existing] = await db
        .select()
        .from(projects)
        .where(eq(projects.projectId, refId));

      // Resolve team IDs
      const leadTeamId = teamMap.get(row.leadTeam?.toLowerCase());
      if (!leadTeamId && row.leadTeam) {
        // Auto-create if enabled
        if (shouldAutoCreateMissing()) {
          const [defaultDept] = await db.select().from(departments).limit(1);
          if (defaultDept) {
            const [newTeam] = await db
              .insert(teams)
              .values({
                name: row.leadTeam,
                description: 'Auto-created during import',
                departmentId: defaultDept.id,
              })
              .returning();
            teamMap.set(row.leadTeam.toLowerCase(), newTeam.id);
            console.log(`  Created team: ${row.leadTeam}`);
          }
        } else {
          stats.errors.push(`${refId}: Unknown lead team "${row.leadTeam}"`);
          stats.projectsSkipped++;
          continue;
        }
      }

      const statusId = statusMap.get(row.status?.toLowerCase());
      if (!statusId) {
        stats.errors.push(`${refId}: Unknown status "${row.status}"`);
        stats.projectsSkipped++;
        continue;
      }

      const projectData = {
        projectId: refId,
        name: row.name,
        statusId,
        leadTeamId: teamMap.get(row.leadTeam?.toLowerCase()) || leadTeamId!,
        startDate: row.startDate || null,
        endDate: row.endDate || null,
        projectManager: row.isOwner || null,
        isOwner: row.isOwner || null,
        sponsor: row.sponsor || null,
        opexBudget: row.opexBudget?.toString() || '0',
        capexBudget: row.capexBudget?.toString() || '0',
        budgetCurrency: 'EUR',
        importedAt: new Date(),
        importSource: options.sourceFile,
      };

      if (existing) {
        // Conflict resolution
        const fieldsToCompare = ['name', 'statusId', 'leadTeamId', 'startDate', 'endDate', 'opexBudget', 'capexBudget'];
        const changedFields = findChangedFields(
          {
            name: existing.name,
            statusId: existing.statusId,
            leadTeamId: existing.leadTeamId,
            startDate: existing.startDate,
            endDate: existing.endDate,
            opexBudget: existing.opexBudget,
            capexBudget: existing.capexBudget,
          },
          projectData,
          fieldsToCompare
        );

        if (changedFields.length === 0) {
          console.log(`  [SKIP] ${refId}: No changes`);
          stats.projectsSkipped++;
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
            },
            incoming: projectData,
            fieldsChanged: changedFields,
          });

          if (resolution === 'skip') {
            console.log(`  [SKIP] ${refId}: User skipped`);
            stats.projectsSkipped++;
          } else if (!options.dryRun) {
            if (resolution === 'update') {
              // Merge: update only changed fields, keep existing values for unchanged
              const updateData: any = { updatedAt: new Date() };
              for (const field of changedFields) {
                updateData[field] = (projectData as any)[field];
              }
              updateData.importedAt = new Date();
              updateData.importSource = options.sourceFile;

              await db.update(projects).set(updateData).where(eq(projects.id, existing.id));
              console.log(`  [UPDATE] ${refId}: ${changedFields.join(', ')}`);
              stats.projectsUpdated++;
            } else if (resolution === 'overwrite') {
              // Replace all fields
              await db.update(projects).set({
                ...projectData,
                updatedAt: new Date(),
              }).where(eq(projects.id, existing.id));
              console.log(`  [OVERWRITE] ${refId}`);
              stats.projectsUpdated++;
            }
          } else {
            console.log(`  [DRY-RUN] Would ${resolution} ${refId}`);
            stats.projectsUpdated++;
          }
        }

        // Process child entities for existing project (merge strategy)
        await processChildEntities(
          existing.id,
          refId,
          teamsByProject.get(refId) || [],
          valuesByProject.get(refId) || [],
          impactByProject.get(refId) || [],
          teamMap,
          outcomeMap,
          deptMap,
          stats,
          options.dryRun
        );

      } else {
        // New project
        if (!options.dryRun) {
          const [newProject] = await db.insert(projects).values(projectData).returning();
          console.log(`  [CREATE] ${refId}: ${row.name}`);
          stats.projectsCreated++;

          // Process child entities for new project
          await processChildEntities(
            newProject.id,
            refId,
            teamsByProject.get(refId) || [],
            valuesByProject.get(refId) || [],
            impactByProject.get(refId) || [],
            teamMap,
            outcomeMap,
            deptMap,
            stats,
            options.dryRun
          );
        } else {
          console.log(`  [DRY-RUN] Would create ${refId}: ${row.name}`);
          stats.projectsCreated++;
        }
      }
    } catch (error: any) {
      stats.errors.push(`${refId}: ${error.message}`);
      console.error(`  [ERROR] ${refId}: ${error.message}`);
    }

    // Progress indicator
    if (processed % BATCH_SIZE === 0) {
      console.log(`\nProgress: ${processed}/${projectRows.length} projects processed\n`);
    }
  }

  closeReadline();

  // Write load report
  writeReport(join(STAGING_DIR, 'load_report.md'), {
    title: 'Data Load Report',
    timestamp: new Date().toISOString(),
    sourceFile: options.sourceFile,
    sections: [],
    warnings: stats.errors,
    summary: {
      'Projects Created': stats.projectsCreated,
      'Projects Updated': stats.projectsUpdated,
      'Projects Skipped': stats.projectsSkipped,
      'Team Assignments Created': stats.teamsCreated,
      'Value Scores Created': stats.valuesCreated,
      'Change Impacts Created': stats.impactCreated,
      'Errors': stats.errors.length,
    },
  });

  console.log('\n--- Load Summary ---');
  console.log(`Projects: ${stats.projectsCreated} created, ${stats.projectsUpdated} updated, ${stats.projectsSkipped} skipped`);
  console.log(`Teams: ${stats.teamsCreated} created`);
  console.log(`Values: ${stats.valuesCreated} created`);
  console.log(`Impact: ${stats.impactCreated} created`);
  console.log(`Errors: ${stats.errors.length}`);

  if (options.dryRun) {
    console.log('\n[DRY RUN] No changes were made to the database.');
  } else {
    console.log('\n✅ Load complete!');
  }

  await pool.end();
}

async function processChildEntities(
  projectId: number,
  projectRefId: string,
  teamAssignments: any[],
  valueScores: any[],
  changeImpacts: any[],
  teamMap: Map<string, number>,
  outcomeMap: Map<string, number>,
  deptMap: Map<string, number>,
  stats: LoadStats,
  dryRun: boolean
): Promise<void> {
  // Process team assignments (merge strategy: add new, keep existing)
  for (const row of teamAssignments) {
    const teamId = teamMap.get(row.teamName?.toLowerCase());
    if (!teamId) continue;

    // Check if already exists
    const [existing] = await db
      .select()
      .from(projectTeams)
      .where(eq(projectTeams.projectId, projectId))
      .where(eq(projectTeams.teamId, teamId));

    if (!existing && !dryRun) {
      await db.insert(projectTeams).values({
        projectId,
        teamId,
        effortSize: row.effortSize,
        isLead: row.isLead === 'true',
      });
      stats.teamsCreated++;
    } else if (!existing) {
      stats.teamsCreated++;
    } else {
      stats.teamsSkipped++;
    }
  }

  // Process value scores (merge strategy)
  for (const row of valueScores) {
    const outcomeId = outcomeMap.get(row.outcomeName?.toLowerCase());
    if (!outcomeId) continue;

    const [existing] = await db
      .select()
      .from(projectValues)
      .where(eq(projectValues.projectId, projectId))
      .where(eq(projectValues.outcomeId, outcomeId));

    if (!existing && !dryRun) {
      await db.insert(projectValues).values({
        projectId,
        outcomeId,
        score: parseInt(row.score, 10),
      });
      stats.valuesCreated++;
    } else if (!existing) {
      stats.valuesCreated++;
    } else {
      stats.valuesSkipped++;
    }
  }

  // Process change impacts (merge strategy)
  for (const row of changeImpacts) {
    // Change impact uses teams table for department lookup
    const teamId = teamMap.get(row.departmentName?.toLowerCase());
    if (!teamId) continue;

    const [existing] = await db
      .select()
      .from(projectChangeImpact)
      .where(eq(projectChangeImpact.projectId, projectId))
      .where(eq(projectChangeImpact.teamId, teamId));

    if (!existing && !dryRun) {
      await db.insert(projectChangeImpact).values({
        projectId,
        teamId,
        impactSize: row.impactSize,
      });
      stats.impactCreated++;
    } else if (!existing) {
      stats.impactCreated++;
    } else {
      stats.impactSkipped++;
    }
  }
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

The load stage:
1. Reads validated CSV files from staging/
2. Checks for existing projects and prompts on conflicts
3. Inserts/updates projects with import tracking
4. Merges child entities (teams, values, impact) - adds new, keeps existing

Requires: Successful validate stage (npx tsx validate.ts)
  `);
  process.exit(0);
}

// Check staging files exist
const requiredFiles = ['projects.csv', 'teams.csv', 'value_scores.csv', 'change_impact.csv'];
for (const file of requiredFiles) {
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
