import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { getTestDb, seedTestData, clearTestData, createTestProject } from './setup.js';
import { departments, teams, statuses, projects } from '../db/schema.js';

describe('Fixtures', () => {
  const db = getTestDb();

  beforeEach(async () => {
    await clearTestData(db);
    await seedTestData(db);
  });

  afterEach(async () => {
    await clearTestData(db);
  });

  test('seedTestData creates departments', async () => {
    const depts = await db.select().from(departments);
    expect(depts).toHaveLength(2);
    expect(depts[0].name).toBe('IT Department');
    expect(depts[1].name).toBe('Finance Department');
  });

  test('seedTestData creates teams', async () => {
    const teamsList = await db.select().from(teams);
    expect(teamsList).toHaveLength(2);
    expect(teamsList[0].name).toBe('Backend Team');
    expect(teamsList[1].name).toBe('Finance Team');
  });

  test('seedTestData creates statuses', async () => {
    const statusList = await db.select().from(statuses);
    expect(statusList.length).toBeGreaterThanOrEqual(3);
    const statusNames = statusList.map((s: { name: string }) => s.name);
    expect(statusNames).toContain('Draft');
    expect(statusNames).toContain('Active');
    expect(statusNames).toContain('Completed');
  });

  test('createTestProject creates a project', async () => {
    const project = await createTestProject(db, { name: 'My Test Project' });
    expect(project).toBeDefined();
    expect(project.name).toBe('My Test Project');
    expect(project.projectId).toMatch(/PRJ-2026-\d{5}/);
  });

  test('clearTestData removes all data', async () => {
    await createTestProject(db);
    await clearTestData(db);

    const projectsList = await db.select().from(projects);
    const depts = await db.select().from(departments);
    const teamsList = await db.select().from(teams);

    expect(projectsList).toHaveLength(0);
    expect(depts).toHaveLength(0);
    expect(teamsList).toHaveLength(0);
  });
});
