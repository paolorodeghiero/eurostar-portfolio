# Projects API

## Projects

### List Projects

```
GET /api/projects
```

Query parameters:
- `stopped` (boolean) - Filter by stopped status
- `reportCurrency` (string) - Currency for budget/actuals display (default: EUR)

Response includes:
- Project details with status, lead team
- All involved teams with effort sizes
- Value scores with outcome names
- Change impact teams with impact sizes
- Budget totals (OPEX, CAPEX, combined)
- Actuals totals (receipts)
- Cost T-shirt size
- Committee state and level

### Get Project

```
GET /api/projects/:id
```

Returns full project data including:
- Status with color and read-only flag
- Lead team with department
- All involved teams with effort sizes
- Value scores with outcome scoring examples
- Change impact teams

### Create Project

```
POST /api/projects
```

Request:
```json
{
  "name": "Project Name",
  "leadTeamId": 1,
  "startDate": "2026-01-15",
  "endDate": "2026-12-31"
}
```

- `name` (required) - Project name
- `leadTeamId` (required) - ID of the lead team
- `startDate` (optional) - Project start date
- `endDate` (optional) - Project end date

Lead team is automatically added to involved teams with default effort size M.

### Update Project

```
PUT /api/projects/:id
```

Request:
```json
{
  "name": "Updated Name",
  "statusId": 2,
  "startDate": "2026-01-15",
  "endDate": "2026-12-31",
  "leadTeamId": 3,
  "projectManager": "John Smith",
  "isOwner": "Jane Doe",
  "sponsor": "Executive Name",
  "description": "Project description",
  "expectedVersion": 1
}
```

- `expectedVersion` (required) - Current version for optimistic locking

Returns 409 Conflict if version mismatch. Read-only statuses (Stopped, Completed) block updates.

### Delete Project

```
DELETE /api/projects/:id
```

Returns 400 if project has actuals recorded.

### Stop Project

```
PATCH /api/projects/:id/stop
```

Transitions project to Stopped status. Saves previous status for reactivation.

### Reactivate Project

```
PATCH /api/projects/:id/reactivate
```

Restores project to previous status (or Draft if none).

### Get People Suggestions

```
GET /api/projects/people-suggestions
```

Returns distinct values for autocomplete:
```json
{
  "projectManagers": ["Alice", "Bob"],
  "isOwners": ["Carol"],
  "sponsors": ["Dave"]
}
```

### Get Actuals Summary

```
GET /api/projects/:id/actuals/summary
```

Query parameters:
- `reportCurrency` - Target currency for display

Response:
```json
{
  "totalReceipts": "50000.00",
  "totalInvoices": "30000.00",
  "totalActuals": "80000.00",
  "currency": "EUR",
  "budgetTotal": "100000.00",
  "budgetRemaining": "50000.00",
  "percentUsed": "50.00",
  "invoicesNeedingAttention": 3
}
```

## Project Teams

### List Teams

```
GET /api/projects/:projectId/teams
```

Returns all involved teams sorted by lead team first, then alphabetically.

### Add Team

```
POST /api/projects/:projectId/teams
```

Request:
```json
{
  "teamId": 5,
  "effortSize": "M"
}
```

- `effortSize` must be: XS, S, M, L, XL, XXL
- Cannot add lead team (already included)
- Returns 409 if team already assigned

### Update Team Effort

```
PUT /api/projects/:projectId/teams/:teamId
```

Request:
```json
{
  "effortSize": "L"
}
```

### Remove Team

```
DELETE /api/projects/:projectId/teams/:teamId
```

Cannot remove the lead team.

## Project Values

### List Value Scores

```
GET /api/projects/:projectId/values
```

Returns scores with outcome details and scoring examples.

### Set Value Score

```
PUT /api/projects/:projectId/values/:outcomeId
```

Request:
```json
{
  "score": 4,
  "justification": "Reason for score"
}
```

- `score` must be integer 1-5
- Creates or updates (upsert)

### Remove Value Score

```
DELETE /api/projects/:projectId/values/:outcomeId
```

## Change Impact

### List Change Impact Teams

```
GET /api/projects/:projectId/change-impact
```

### Add Change Impact

```
POST /api/projects/:projectId/change-impact
```

Request:
```json
{
  "teamId": 5,
  "impactSize": "L"
}
```

- `impactSize` must be: XS, S, M, L, XL, XXL
- Returns 409 if team already has impact entry

### Update Impact Size

```
PUT /api/projects/:projectId/change-impact/:teamId
```

Request:
```json
{
  "impactSize": "XL"
}
```

### Remove Change Impact

```
DELETE /api/projects/:projectId/change-impact/:teamId
```

## Project Budget

### Get Budget

```
GET /api/projects/:projectId/budget
```

Response:
```json
{
  "opexBudget": "50000.00",
  "capexBudget": "30000.00",
  "convertedOpex": "43000.00",
  "convertedCapex": "25800.00",
  "budgetCurrency": "EUR",
  "reportCurrency": "GBP",
  "costTshirt": "M",
  "totalBudget": "68800.00",
  "totalAllocated": "45000.00",
  "allocationMatch": false,
  "allocations": [...]
}
```

Budget values are stored in EUR. `convertedOpex`/`convertedCapex` show report currency values.

### Update Budget

```
PUT /api/projects/:projectId/budget
```

Request:
```json
{
  "opexBudget": "50000.00",
  "capexBudget": "30000.00",
  "inputCurrency": "GBP",
  "reportCurrency": "GBP"
}
```

- `inputCurrency` - Currency of provided values (default: EUR)
- Input values are converted to EUR for storage
- Cost T-shirt and committee level are auto-calculated

### List Budget Allocations

```
GET /api/projects/:projectId/budget/allocations
```

### Create Allocation

```
POST /api/projects/:projectId/budget/allocations
```

Request:
```json
{
  "budgetLineId": 5,
  "allocationAmount": "10000.00"
}
```

Uses SERIALIZABLE transaction isolation. Returns 400 if exceeds available:
```json
{
  "error": "Exceeds available",
  "available": "5000.00",
  "requested": "10000.00",
  "lineAmount": "20000.00",
  "currentAllocated": "15000.00"
}
```

### Update Allocation

```
PUT /api/projects/:projectId/budget/allocations/:budgetLineId
```

Request:
```json
{
  "allocationAmount": "15000.00"
}
```

### Delete Allocation

```
DELETE /api/projects/:projectId/budget/allocations/:budgetLineId
```

## Committee

### Get Committee Status

```
GET /api/projects/:id/committee
```

Response:
```json
{
  "committeeState": "draft",
  "committeeLevel": "ISMT",
  "businessCaseFile": "uuid.pdf",
  "allowedTransitions": ["presented"]
}
```

### Transition Committee State

```
PATCH /api/projects/:id/committee-state
```

Request:
```json
{
  "committeeState": "presented"
}
```

Valid states: `draft`, `presented`, `discussion`, `approved`, `rejected`

Returns 400 if transition is not allowed from current state.

## Business Case Files

### Upload Business Case

```
POST /api/projects/:id/business-case
```

Content-Type: `multipart/form-data`

Allowed file types: `.pdf`, `.docx`, `.doc`, `.pptx`, `.ppt`

Response:
```json
{
  "filename": "uuid.pdf",
  "originalFilename": "business-case.pdf",
  "size": 245678,
  "project": {
    "id": 1,
    "businessCaseFile": "uuid.pdf",
    "version": 3
  }
}
```

### Download Business Case

```
GET /api/projects/:id/business-case/download
```

Returns file with Content-Disposition attachment header.

### Delete Business Case

```
DELETE /api/projects/:id/business-case
```

## Project History

### Get Audit History

```
GET /api/projects/:id/history
```

Query parameters:
- `limit` (default: 50, max: 100)
- `offset` (default: 0)

Response:
```json
{
  "history": [
    {
      "id": 123,
      "timestamp": "2026-01-15T10:30:00.000Z",
      "user": "user@example.com",
      "operation": "UPDATE",
      "changes": [
        {
          "field": "statusId",
          "fieldLabel": "Status",
          "oldValue": 1,
          "newValue": 2,
          "resolvedOldValue": "Draft",
          "resolvedNewValue": "In Progress"
        }
      ]
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

Reference fields (statusId, leadTeamId) include resolved names.
