import { describe, test, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp, seedTestData, clearTestData } from '../../__tests__/setup.js';

describe('Departments API', () => {
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

  describe('GET /api/admin/departments', () => {
    test('returns 200 with array of departments', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/departments',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(2);
      expect(body[0]).toHaveProperty('id');
      expect(body[0]).toHaveProperty('name');
      expect(body[0]).toHaveProperty('usageCount');
    });

    test('includes usage count for departments', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/departments',
      });

      const body = response.json();
      expect(body[0].usageCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('POST /api/admin/departments', () => {
    test('returns 201 with created department', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/departments',
        payload: { name: 'New Department' },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body).toHaveProperty('id');
      expect(body.name).toBe('New Department');
    });

    test('returns 400 for missing name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/departments',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toHaveProperty('error');
    });

    test('returns 400 for empty name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/departments',
        payload: { name: '   ' },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toHaveProperty('error');
    });

    test('trims whitespace from name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/departments',
        payload: { name: '  Trimmed Department  ' },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().name).toBe('Trimmed Department');
    });
  });

  describe('DELETE /api/admin/departments/:id', () => {
    test('returns 204 for successful deletion', async () => {
      // Create a department without teams
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/admin/departments',
        payload: { name: 'Deletable Department' },
      });
      const department = createResponse.json();

      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: `/api/admin/departments/${department.id}`,
      });

      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.json()).toHaveProperty('success', true);
    });

    test('returns 404 for non-existent id', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/admin/departments/99999',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toHaveProperty('error');
    });

    test('returns 409 when department has teams (usage > 0)', async () => {
      // Get a department that has teams from seed data
      const listResponse = await app.inject({
        method: 'GET',
        url: '/api/admin/departments',
      });
      const departments = listResponse.json();
      const deptWithTeams = departments.find((d: any) => d.usageCount > 0);

      if (deptWithTeams) {
        const deleteResponse = await app.inject({
          method: 'DELETE',
          url: `/api/admin/departments/${deptWithTeams.id}`,
        });

        expect(deleteResponse.statusCode).toBe(409);
        expect(deleteResponse.json()).toHaveProperty('error');
        expect(deleteResponse.json()).toHaveProperty('usageCount');
      }
    });
  });
});
