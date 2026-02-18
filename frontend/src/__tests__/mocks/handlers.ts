import { http, HttpResponse } from 'msw'

export const handlers = [
  // Projects list
  http.get('/api/projects', () => {
    return HttpResponse.json([
      {
        id: 1,
        projectId: 'PRJ-2026-001',
        name: 'Test Project',
        statusId: 1,
        status: { id: 1, name: 'Active', color: '#22c55e', isReadOnly: false },
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        opexAmount: '50000',
        capexAmount: '100000',
        version: 1
      }
    ])
  }),

  // Single project
  http.get('/api/projects/:id', ({ params }) => {
    return HttpResponse.json({
      id: Number(params.id),
      projectId: 'PRJ-2026-001',
      name: 'Test Project',
      statusId: 1,
      status: { id: 1, name: 'Active', color: '#22c55e', isReadOnly: false },
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      opexAmount: '50000',
      capexAmount: '100000',
      version: 1
    })
  }),

  // Departments
  http.get('/api/admin/departments', () => {
    return HttpResponse.json([
      { id: 1, name: 'IT', usageCount: 5 },
      { id: 2, name: 'HR', usageCount: 2 }
    ])
  }),

  // Teams
  http.get('/api/admin/teams', () => {
    return HttpResponse.json([
      { id: 1, name: 'Platform', departmentId: 1, usageCount: 3 },
      { id: 2, name: 'Data', departmentId: 1, usageCount: 2 }
    ])
  }),

  // Statuses
  http.get('/api/admin/statuses', () => {
    return HttpResponse.json([
      { id: 1, name: 'Draft', color: '#9ca3af', isSystemStatus: true, isReadOnly: false },
      { id: 2, name: 'Active', color: '#22c55e', isSystemStatus: false, isReadOnly: false }
    ])
  }),

  // Outcomes for value scoring
  http.get('/api/admin/outcomes', () => {
    return HttpResponse.json([
      { id: 1, name: 'Customer Experience', usageCount: 10 },
      { id: 2, name: 'Revenue Growth', usageCount: 8 }
    ])
  })
]
