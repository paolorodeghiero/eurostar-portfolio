import { describe, test, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp, seedTestData, clearTestData, createTestProject } from '../../__tests__/setup.js';
import { teams } from '../../db/schema.js';

describe('Projects API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await getTestApp();
  }, 30000); // 30 second timeout for app initialization

  beforeEach(async () => {
    await seedTestData(app.db);
  });

  afterEach(async () => {
    await clearTestData(app.db);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/projects', () => {
    test('returns 200 with array of projects', async () => {
      // Create a test project
      await createTestProject(app.db, { name: 'Test Project' });

      const response = await app.inject({
        method: 'GET',
        url: '/api/projects',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);
      expect(body[0]).toHaveProperty('projectId');
      expect(body[0]).toHaveProperty('name');
    });

    test('respects reportCurrency query parameter', async () => {
      await createTestProject(app.db, {
        name: 'Project with Budget',
        opexBudget: '10000.00',
        budgetCurrency: 'EUR',
      });

      const responseEur = await app.inject({
        method: 'GET',
        url: '/api/projects?reportCurrency=EUR',
      });

      const responseGbp = await app.inject({
        method: 'GET',
        url: '/api/projects?reportCurrency=GBP',
      });

      expect(responseEur.statusCode).toBe(200);
      expect(responseGbp.statusCode).toBe(200);

      const eurBody = responseEur.json();
      const gbpBody = responseGbp.json();

      expect(eurBody[0].reportCurrency).toBe('EUR');
      expect(gbpBody[0].reportCurrency).toBe('GBP');
    });

    test('returns empty array when no projects exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
    });
  });

  describe('POST /api/projects', () => {
    test('returns 201 with auto-generated projectId in PRJ-YYYY-NNN format', async () => {
      // Get a team from seed data
      const teamsList = await app.db.select().from(teams).limit(1);
      const teamId = teamsList[0].id;

      const response = await app.inject({
        method: 'POST',
        url: '/api/projects',
        payload: {
          name: 'New Project',
          leadTeamId: teamId,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body).toHaveProperty('projectId');
      expect(body.projectId).toMatch(/^PRJ-\d{4}-\d{5}$/);
      expect(body.name).toBe('New Project');
    });

    test('returns 400 for missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/projects',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toHaveProperty('error');
    });

    test('returns 400 for missing name', async () => {
      const teamsList = await app.db.select().from(teams).limit(1);

      const response = await app.inject({
        method: 'POST',
        url: '/api/projects',
        payload: {
          leadTeamId: teamsList[0].id,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toContain('Name is required');
    });

    test('returns 400 for invalid leadTeamId', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/projects',
        payload: {
          name: 'Test Project',
          leadTeamId: 99999,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toContain('Lead team not found');
    });

    test('created project appears in subsequent GET', async () => {
      const teamsList = await app.db.select().from(teams).limit(1);

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/projects',
        payload: {
          name: 'Created Project',
          leadTeamId: teamsList[0].id,
        },
      });

      expect(createResponse.statusCode).toBe(201);

      const listResponse = await app.inject({
        method: 'GET',
        url: '/api/projects',
      });

      const projects = listResponse.json();
      expect(projects.some((p: any) => p.name === 'Created Project')).toBe(true);
    });
  });

  describe('GET /api/projects/:id', () => {
    test('returns 200 with project details including teams, values, changeImpact', async () => {
      const project = await createTestProject(app.db, { name: 'Detailed Project' });

      const response = await app.inject({
        method: 'GET',
        url: `/api/projects/${project.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('id', project.id);
      expect(body).toHaveProperty('name', 'Detailed Project');
      expect(body).toHaveProperty('teams');
      expect(body).toHaveProperty('values');
      expect(body).toHaveProperty('changeImpact');
      expect(Array.isArray(body.teams)).toBe(true);
      expect(Array.isArray(body.values)).toBe(true);
      expect(Array.isArray(body.changeImpact)).toBe(true);
    });

    test('returns 404 for non-existent project', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects/99999',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toHaveProperty('error');
    });
  });

  describe('PUT /api/projects/:id', () => {
    test('returns 200 with updated project', async () => {
      const project = await createTestProject(app.db, { name: 'Original Name' });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/projects/${project.id}`,
        payload: {
          name: 'Updated Name',
          expectedVersion: project.version,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.name).toBe('Updated Name');
      expect(body.version).toBe(project.version + 1);
    });

    test('validates version for optimistic locking (409 on conflict)', async () => {
      const project = await createTestProject(app.db, { name: 'Version Test' });

      // First update succeeds
      await app.inject({
        method: 'PUT',
        url: `/api/projects/${project.id}`,
        payload: {
          name: 'First Update',
          expectedVersion: project.version,
        },
      });

      // Second update with stale version fails
      const conflictResponse = await app.inject({
        method: 'PUT',
        url: `/api/projects/${project.id}`,
        payload: {
          name: 'Second Update',
          expectedVersion: project.version, // Stale version
        },
      });

      expect(conflictResponse.statusCode).toBe(409);
      expect(conflictResponse.json()).toHaveProperty('error');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    test('returns 200 for successful deletion', async () => {
      const project = await createTestProject(app.db, { name: 'To Be Deleted' });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/projects/${project.id}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toHaveProperty('success', true);

      // Verify project is deleted
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/${project.id}`,
      });

      expect(getResponse.statusCode).toBe(404);
    });

    test('returns 404 for non-existent project', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/projects/99999',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toHaveProperty('error');
    });
  });
});
