# Routes Documentation

## Route Organization

Routes are organized by domain in separate directories under `routes/`:

```
routes/
  admin/              # Admin-only referential data
    referentials.ts   # Index route, mounts all admin sub-routes
    departments.ts
    teams.ts
    statuses.ts
    outcomes.ts
    cost-centers.ts
    currency-rates.ts
    committee-levels.ts
    committee-thresholds.ts
    cost-tshirt-thresholds.ts
    competence-month-patterns.ts
    budget-lines.ts
    audit-log.ts
  projects/           # Project resources
    index.ts          # Router, mounts all project sub-routes
    projects.ts       # Core CRUD
    project-teams.ts
    project-values.ts
    project-change-impact.ts
    project-budget.ts
    project-committee.ts
    project-files.ts
    project-history.ts
  actuals/
    index.ts          # Router
    receipts.ts
    invoices.ts
  alerts/
    index.ts          # Router
    alerts.ts
```

## Admin Routes (`/api/admin`)

All admin routes require admin role. The `requireAdmin` preHandler is applied at the referentials router level.

### Referential Index

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin` | List all referential types |
| GET | `/api/admin/stats` | Count for each referential type |

### Standard Referential Pattern

Each referential (departments, teams, statuses, outcomes, cost-centers) follows:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/{type}` | List all with usage count |
| GET | `/api/admin/{type}/:id` | Get one with usage details |
| POST | `/api/admin/{type}` | Create new |
| PUT | `/api/admin/{type}/:id` | Update |
| DELETE | `/api/admin/{type}/:id` | Delete (blocked if in use) |
| GET | `/api/admin/{type}/:id/usage` | Get usage details |
| POST | `/api/admin/{type}/import` | Bulk import from Excel |
| GET | `/api/admin/{type}/export` | Export to Excel |

### Currency Rates

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/currency-rates` | List all with validity periods |
| POST | `/api/admin/currency-rates` | Create rate with validFrom date |
| DELETE | `/api/admin/currency-rates/:id` | Delete (blocked if used in calculations) |

### Committee Thresholds

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/committee-thresholds` | List thresholds with level names |
| PUT | `/api/admin/committee-thresholds/:id` | Update threshold maxAmount |

### Cost T-shirt Thresholds

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/cost-tshirt-thresholds` | List size thresholds by currency |
| PUT | `/api/admin/cost-tshirt-thresholds/:id` | Update threshold |

### Budget Lines

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/budget-lines` | List with filters (fiscalYear, company, type) |
| GET | `/api/admin/budget-lines/:id` | Get with allocation details |
| GET | `/api/admin/budget-lines/template` | Download import template |
| POST | `/api/admin/budget-lines/import` | Import from Excel |
| DELETE | `/api/admin/budget-lines/:id` | Delete (blocked if allocated) |

### Audit Log

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/audit-log` | Query audit entries with filters |

Query parameters: `startDate`, `endDate`, `tableName`, `changedBy`, `operation`, `limit`, `offset`

## Project Routes (`/api/projects`)

### Core Project CRUD

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List all with nested data |
| GET | `/api/projects/:id` | Get single with all relations |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update with optimistic locking |
| DELETE | `/api/projects/:id` | Delete (blocked if has actuals) |
| PATCH | `/api/projects/:id/stop` | Stop project |
| PATCH | `/api/projects/:id/reactivate` | Reactivate stopped project |
| GET | `/api/projects/people-suggestions` | Autocomplete values |

Query parameters for list: `stopped`, `reportCurrency`

### Project Teams

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects/:id/teams` | List teams with effort sizes |
| POST | `/api/projects/:id/teams` | Add team |
| PUT | `/api/projects/:id/teams/:teamId` | Update effort size |
| DELETE | `/api/projects/:id/teams/:teamId` | Remove team |

### Project Values

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects/:id/values` | List value scores |
| PUT | `/api/projects/:id/values/:outcomeId` | Set score and justification |

### Project Change Impact

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects/:id/change-impact` | List impacted teams |
| POST | `/api/projects/:id/change-impact` | Add impact |
| PUT | `/api/projects/:id/change-impact/:teamId` | Update impact size |
| DELETE | `/api/projects/:id/change-impact/:teamId` | Remove impact |

### Project Budget

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects/:id/budget` | Get budget with allocations |
| PUT | `/api/projects/:id/budget` | Update OPEX/CAPEX (auto-derives T-shirt) |
| GET | `/api/projects/:id/budget/allocations` | List allocations |
| POST | `/api/projects/:id/budget/allocations` | Create allocation (validates available) |
| PUT | `/api/projects/:id/budget/allocations/:budgetLineId` | Update allocation |
| DELETE | `/api/projects/:id/budget/allocations/:budgetLineId` | Remove allocation |

### Project Committee

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects/:id/committee` | Get state and allowed transitions |
| PATCH | `/api/projects/:id/committee-state` | Transition state |

### Project Files

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/projects/:id/files/business-case` | Upload business case |
| GET | `/api/projects/:id/files/business-case` | Download business case |
| DELETE | `/api/projects/:id/files/business-case` | Remove business case |

### Project History

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects/:id/history` | Audit log for project |

### Project Actuals Summary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects/:id/actuals/summary` | Budget vs actuals summary |

## Actuals Routes (`/api/actuals`)

### Receipts

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/actuals/receipts` | List with filters |
| GET | `/api/actuals/receipts/template` | Download import template |
| POST | `/api/actuals/receipts/upload` | Upload Excel file |
| POST | `/api/actuals/receipts/import` | Batch import JSON |
| DELETE | `/api/actuals/receipts/:id` | Delete receipt |

Query parameters: `projectId`, `fromDate`, `toDate`, `currency`, `reportCurrency`

### Invoices

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/actuals/invoices` | List with filters |
| GET | `/api/actuals/invoices/template` | Download import template |
| POST | `/api/actuals/invoices/upload` | Upload Excel file |
| POST | `/api/actuals/invoices/import` | Batch import JSON |
| PUT | `/api/actuals/invoices/:id/competence-month` | Override competence month |
| DELETE | `/api/actuals/invoices/:id` | Delete invoice |

Query parameters: `projectId`, `fromDate`, `toDate`, `extractionFailed`, `reportCurrency`

## Alerts Routes (`/api/alerts`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/alerts` | Get active alerts |
| GET | `/api/alerts/config` | Get alert configuration |
| PUT | `/api/alerts/config/:type` | Update alert settings |

Alert types: `overdue`, `budget_limit`

## Authentication Patterns

### Skip Authentication

Routes that skip auth (handled in auth plugin):
- `GET /health`
- `GET /docs/*`

### Admin-Only Routes

Admin routes use `requireAdmin` middleware:

```typescript
fastify.addHook('preHandler', requireAdmin);
```

The middleware checks `request.user.role === 'admin'` and returns 403 if not.

### Optimistic Locking

Project updates require `expectedVersion` in request body:

```typescript
PUT /api/projects/:id
Body: { expectedVersion: 5, name: "New name" }
```

Returns 409 on version conflict with current data.
