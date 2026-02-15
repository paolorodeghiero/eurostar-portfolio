import type { FastifyInstance } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import { teams, departments, projects, projectTeams, statuses } from '../../db/schema.js';
import * as XLSX from 'xlsx';

export async function teamsRoutes(fastify: FastifyInstance) {
  const db = fastify.db;

  // List all teams with usage count
  fastify.get('/', async () => {
    const teamsList = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        departmentId: teams.departmentId,
        departmentName: departments.name,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
      })
      .from(teams)
      .leftJoin(departments, eq(teams.departmentId, departments.id));

    // Get usage counts (unique projects using each team as lead or involved)
    const teamsWithUsage = await Promise.all(
      teamsList.map(async (team) => {
        // Count unique projects where team is lead OR involved (avoid double counting)
        const result = await db.execute(sql`
          SELECT COUNT(*) as count FROM (
            SELECT id FROM projects WHERE lead_team_id = ${team.id}
            UNION
            SELECT project_id FROM project_teams WHERE team_id = ${team.id}
          ) as unique_projects
        `);
        const usageCount = Number((result.rows[0] as { count: string })?.count) || 0;
        return { ...team, usageCount };
      })
    );

    return teamsWithUsage;
  });

  // Get single team
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const [team] = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        departmentId: teams.departmentId,
        departmentName: departments.name,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
      })
      .from(teams)
      .leftJoin(departments, eq(teams.departmentId, departments.id))
      .where(eq(teams.id, id));

    if (!team) {
      return reply.code(404).send({ error: 'Team not found' });
    }

    // Count unique projects where team is lead OR involved
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM (
        SELECT id FROM projects WHERE lead_team_id = ${id}
        UNION
        SELECT project_id FROM project_teams WHERE team_id = ${id}
      ) as unique_projects
    `);
    const usageCount = Number((result.rows[0] as { count: string })?.count) || 0;

    return { ...team, usageCount, usedBy: [] };
  });

  // Create team
  fastify.post<{
    Body: { name: string; description?: string; departmentId: number };
  }>('/', async (request, reply) => {
    const { name, description, departmentId } = request.body;

    if (!name?.trim()) {
      return reply.code(400).send({ error: 'Name is required' });
    }
    if (!departmentId) {
      return reply.code(400).send({ error: 'Department ID is required' });
    }

    // Verify department exists
    const [dept] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, departmentId));
    if (!dept) {
      return reply.code(400).send({ error: 'Department not found' });
    }

    const [team] = await db
      .insert(teams)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        departmentId,
      })
      .returning();

    return reply.code(201).send(team);
  });

  // Update team
  fastify.put<{
    Params: { id: string };
    Body: { name?: string; description?: string; departmentId?: number };
  }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const { name, description, departmentId } = request.body;

    const updates: Partial<typeof teams.$inferInsert> = { updatedAt: new Date() };
    if (name?.trim()) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (departmentId) {
      const [dept] = await db
        .select()
        .from(departments)
        .where(eq(departments.id, departmentId));
      if (!dept) {
        return reply.code(400).send({ error: 'Department not found' });
      }
      updates.departmentId = departmentId;
    }

    const [team] = await db
      .update(teams)
      .set(updates)
      .where(eq(teams.id, id))
      .returning();

    if (!team) {
      return reply.code(404).send({ error: 'Team not found' });
    }

    return team;
  });

  // Bulk import teams from Excel/CSV
  fastify.post('/import', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    try {
      const buffer = await data.toBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<{
        name: string;
        departmentName: string;
        description?: string;
      }>(sheet);

      if (rows.length === 0) {
        return reply.code(400).send({ error: 'File is empty' });
      }

      const errors: string[] = [];
      const validRows: Array<{
        name: string;
        departmentId: number;
        description?: string;
      }> = [];

      // Validate all rows first
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row.name?.trim()) {
          errors.push(`Row ${i + 2}: Name is required`);
          continue;
        }
        if (!row.departmentName?.trim()) {
          errors.push(`Row ${i + 2}: Department name is required`);
          continue;
        }

        // Lookup department by name
        const [dept] = await db
          .select()
          .from(departments)
          .where(eq(departments.name, row.departmentName.trim()));
        if (!dept) {
          errors.push(`Row ${i + 2}: Department "${row.departmentName}" not found`);
          continue;
        }

        validRows.push({
          name: row.name.trim(),
          departmentId: dept.id,
          description: row.description?.trim() || undefined,
        });
      }

      if (errors.length > 0) {
        return reply.code(400).send({ error: 'Validation failed', errors });
      }

      // Insert all valid rows
      let imported = 0;
      for (const row of validRows) {
        await db.insert(teams).values(row);
        imported++;
      }

      return { imported, total: rows.length };
    } catch (error: any) {
      return reply.code(500).send({ error: 'Import failed', message: error.message });
    }
  });

  // Export teams as Excel
  fastify.get('/export', async (request, reply) => {
    const teamsList = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        departmentName: departments.name,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
      })
      .from(teams)
      .leftJoin(departments, eq(teams.departmentId, departments.id));

    const ws = XLSX.utils.json_to_sheet(
      teamsList.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description || '',
        departmentName: t.departmentName,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Teams');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return reply
      .header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      .header('Content-Disposition', 'attachment; filename="teams.xlsx"')
      .send(buffer);
  });

  // Get team usage details
  fastify.get<{ Params: { id: string } }>('/:id/usage', async (request, reply) => {
    const id = parseInt(request.params.id);

    // Check if team exists
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    if (!team) {
      return reply.code(404).send({ error: 'Team not found' });
    }

    // Find projects where team is lead
    const leadProjects = await db
      .select({
        id: projects.id,
        projectId: projects.projectId,
        name: projects.name,
        statusName: statuses.name,
        role: sql<string>`'lead'`.as('role'),
      })
      .from(projects)
      .leftJoin(statuses, eq(projects.statusId, statuses.id))
      .where(eq(projects.leadTeamId, id));

    // Find projects where team is involved (not lead)
    const involvedProjects = await db
      .select({
        id: projects.id,
        projectId: projects.projectId,
        name: projects.name,
        statusName: statuses.name,
        role: sql<string>`'involved'`.as('role'),
      })
      .from(projectTeams)
      .innerJoin(projects, eq(projectTeams.projectId, projects.id))
      .leftJoin(statuses, eq(projects.statusId, statuses.id))
      .where(eq(projectTeams.teamId, id));

    // Combine results
    const allProjects = [...leadProjects, ...involvedProjects];

    return { projects: allProjects };
  });

  // Delete team (blocked if in use by projects)
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = parseInt(request.params.id);

    // Count unique projects where team is lead OR involved
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM (
        SELECT id FROM projects WHERE lead_team_id = ${id}
        UNION
        SELECT project_id FROM project_teams WHERE team_id = ${id}
      ) as unique_projects
    `);
    const usageCount = Number((result.rows[0] as { count: string })?.count) || 0;

    if (usageCount > 0) {
      return reply.code(409).send({
        error: 'Cannot delete',
        message: `Team is used by ${usageCount} project(s)`,
        usageCount,
      });
    }

    const [deleted] = await db
      .delete(teams)
      .where(eq(teams.id, id))
      .returning();

    if (!deleted) {
      return reply.code(404).send({ error: 'Team not found' });
    }

    return { success: true, deleted };
  });
}
