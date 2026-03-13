# Admin API

All admin endpoints require the `admin` role. Non-admin users receive 403 Forbidden.

## Referentials Overview

### List All Referential Types

```
GET /api/admin
```

Response:
```json
{
  "types": [
    { "id": "departments", "name": "Departments", "endpoint": "/api/admin/departments" },
    { "id": "teams", "name": "Teams", "endpoint": "/api/admin/teams" },
    { "id": "statuses", "name": "Statuses", "endpoint": "/api/admin/statuses" },
    { "id": "outcomes", "name": "Outcomes", "endpoint": "/api/admin/outcomes" },
    { "id": "cost-centers", "name": "Cost Centers", "endpoint": "/api/admin/cost-centers" },
    { "id": "currency-rates", "name": "Currency Rates", "endpoint": "/api/admin/currency-rates" },
    { "id": "committee-levels", "name": "Committee Levels", "endpoint": "/api/admin/committee-levels" },
    { "id": "committee-thresholds", "name": "Committee Thresholds", "endpoint": "/api/admin/committee-thresholds" },
    { "id": "cost-tshirt-thresholds", "name": "Cost T-shirt Thresholds", "endpoint": "/api/admin/cost-tshirt-thresholds" },
    { "id": "competence-month-patterns", "name": "Competence Month Patterns", "endpoint": "/api/admin/competence-month-patterns" }
  ]
}
```

### Get Referential Stats

```
GET /api/admin/stats
```

Response:
```json
{
  "departments": 5,
  "teams": 12,
  "statuses": 6,
  "outcomes": 8,
  "costCenters": 15,
  "currencyRates": 4,
  "committeeLevels": 3,
  "committeeThresholds": 3,
  "costTshirtThresholds": 6,
  "competenceMonthPatterns": 10
}
```

## Departments

### List Departments

```
GET /api/admin/departments
```

Response includes `usageCount` (number of teams using each department).

### Get Department

```
GET /api/admin/departments/:id
```

Response includes `usedBy` array of teams.

### Create Department

```
POST /api/admin/departments
```

Request:
```json
{
  "name": "IT Department"
}
```

### Update Department

```
PUT /api/admin/departments/:id
```

### Get Usage Details

```
GET /api/admin/departments/:id/usage
```

Returns list of teams belonging to this department.

### Delete Department

```
DELETE /api/admin/departments/:id
```

Returns 409 if in use by teams.

### Import from Excel

```
POST /api/admin/departments/import
```

Content-Type: `multipart/form-data`

Expected columns: `name`

### Export to Excel

```
GET /api/admin/departments/export
```

Returns Excel file.

## Teams

### List Teams

```
GET /api/admin/teams
```

Response includes department name and `usageCount` (projects using team).

### Get Team

```
GET /api/admin/teams/:id
```

### Create Team

```
POST /api/admin/teams
```

Request:
```json
{
  "name": "Backend Team",
  "departmentId": 1,
  "description": "Optional description"
}
```

### Update Team

```
PUT /api/admin/teams/:id
```

### Get Usage Details

```
GET /api/admin/teams/:id/usage
```

Returns projects where team is lead or involved:
```json
{
  "projects": [
    {
      "id": 1,
      "projectId": "PRJ-2026-00001",
      "name": "Project Name",
      "statusName": "In Progress",
      "role": "lead"
    }
  ]
}
```

### Delete Team

```
DELETE /api/admin/teams/:id
```

Returns 409 if used by projects.

### Import/Export

```
POST /api/admin/teams/import
GET /api/admin/teams/export
```

Import expects columns: `name`, `departmentName`, `description`

## Statuses

### List Statuses

```
GET /api/admin/statuses
```

Ordered by `displayOrder`. Response includes:
- `usageCount` - Projects using this status
- `isSystemStatus` - Cannot be deleted (Draft, Stopped, Completed)
- `isReadOnly` - Projects in this status cannot be modified

### Create Status

```
POST /api/admin/statuses
```

Request:
```json
{
  "name": "In Review",
  "color": "#FF5733",
  "displayOrder": 5
}
```

- `color` must be valid hex format (#RRGGBB)
- `isSystemStatus` and `isReadOnly` are server-controlled

### Update Status

```
PUT /api/admin/statuses/:id
```

### Get Usage Details

```
GET /api/admin/statuses/:id/usage
```

Returns list of projects with this status.

### Delete Status

```
DELETE /api/admin/statuses/:id
```

Returns 400 if system status. Returns 409 if in use.

## Outcomes

### List Outcomes

```
GET /api/admin/outcomes
```

### Get Outcome

```
GET /api/admin/outcomes/:id
```

### Create Outcome

```
POST /api/admin/outcomes
```

Request:
```json
{
  "name": "Customer Satisfaction",
  "score1Example": "No impact on customer satisfaction",
  "score2Example": "Minor improvement",
  "score3Example": "Moderate improvement",
  "score4Example": "Significant improvement",
  "score5Example": "Transformational impact"
}
```

### Update Outcome

```
PUT /api/admin/outcomes/:id
```

### Get Usage Details

```
GET /api/admin/outcomes/:id/usage
```

Returns project values using this outcome.

### Delete Outcome

```
DELETE /api/admin/outcomes/:id
```

### Import/Export

```
POST /api/admin/outcomes/import
GET /api/admin/outcomes/export
```

## Cost Centers

### List Cost Centers

```
GET /api/admin/cost-centers
```

### Create Cost Center

```
POST /api/admin/cost-centers
```

Request:
```json
{
  "code": "CC001",
  "description": "IT Operations"
}
```

Code must be unique.

### Get Usage Details

```
GET /api/admin/cost-centers/:id/usage
```

Returns budget lines using this cost center.

### Import/Export

```
POST /api/admin/cost-centers/import
GET /api/admin/cost-centers/export
```

## Currency Rates

### List Currency Rates

```
GET /api/admin/currency-rates
```

### Create Currency Rate

```
POST /api/admin/currency-rates
```

Request:
```json
{
  "fromCurrency": "GBP",
  "toCurrency": "EUR",
  "rate": "1.17",
  "validFrom": "2026-01-01",
  "validTo": "2026-12-31"
}
```

- `fromCurrency`/`toCurrency` must be 3 uppercase letters
- `rate` must be positive number
- `validTo` is optional (open-ended rate)

### Update Currency Rate

```
PUT /api/admin/currency-rates/:id
```

### Delete Currency Rate

```
DELETE /api/admin/currency-rates/:id
```

## Budget Lines

### List Budget Lines

```
GET /api/admin/budget-lines
```

Query parameters:
- `fiscalYear` - Filter by fiscal year
- `company` - Filter by company code
- `type` - Filter by OPEX/CAPEX

Response includes `allocatedAmount` and `availableAmount`.

### Get Budget Line

```
GET /api/admin/budget-lines/:id
```

Response includes `usedByProjects` array showing allocations.

### Download Template

```
GET /api/admin/budget-lines/template
```

Returns Excel template for import.

### Import Budget Lines

```
POST /api/admin/budget-lines/import
```

Content-Type: `multipart/form-data`

Expected columns: `Company`, `Department`, `CostCenter`, `LineValue`, `Amount`, `Currency`, `Type`, `FiscalYear`

- Department looked up by name
- Cost center looked up by code
- Currency validated against currency_rates

### Delete Budget Line

```
DELETE /api/admin/budget-lines/:id
```

Returns 409 if allocated to projects.

## Audit Log

### Query Audit Log

```
GET /api/admin/audit-log
```

Query parameters:
- `startDate` - ISO date string
- `endDate` - ISO date string
- `tableName` - Filter by table (e.g., "projects")
- `changedBy` - Filter by user (partial match)
- `operation` - Filter by operation (INSERT, UPDATE, DELETE)
- `limit` (default: 50, max: 200)
- `offset` (default: 0)

Response:
```json
{
  "entries": [
    {
      "id": 1,
      "tableName": "projects",
      "recordId": 5,
      "changedBy": "user@example.com",
      "changedAt": "2026-01-15T10:30:00.000Z",
      "operation": "UPDATE",
      "changes": {
        "name": { "old": "Old Name", "new": "New Name" }
      }
    }
  ],
  "total": 1500
}
```
