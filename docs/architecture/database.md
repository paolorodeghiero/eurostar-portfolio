# Database Schema

The application uses PostgreSQL with Drizzle ORM. Schema definitions are in `backend/src/db/schema.ts`.

## Tables

### Reference Data Tables

#### departments
Organization departments that own teams.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| name | varchar(255) | NOT NULL, UNIQUE |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |

#### teams
Teams within departments that work on projects.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| name | varchar(255) | NOT NULL |
| description | varchar(500) | nullable |
| department_id | integer | NOT NULL, FK -> departments.id (ON DELETE RESTRICT) |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |

#### statuses
Project lifecycle statuses.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| name | varchar(100) | NOT NULL, UNIQUE |
| color | varchar(7) | NOT NULL (hex color code) |
| display_order | integer | NOT NULL |
| is_system_status | boolean | NOT NULL, default false |
| is_read_only | boolean | NOT NULL, default false |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |

#### outcomes
Value scoring criteria for project assessment.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| name | varchar(255) | NOT NULL, UNIQUE |
| score_1_example | text | nullable |
| score_2_example | text | nullable |
| score_3_example | text | nullable |
| score_4_example | text | nullable |
| score_5_example | text | nullable |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |

#### cost_centers
Financial cost centers for budget tracking.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| code | varchar(50) | NOT NULL, UNIQUE |
| description | varchar(255) | nullable |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |

#### currency_rates
Exchange rates between currencies.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| from_currency | varchar(3) | NOT NULL (ISO 4217) |
| to_currency | varchar(3) | NOT NULL (ISO 4217) |
| rate | numeric(10,6) | NOT NULL |
| valid_from | date | NOT NULL |
| valid_to | date | nullable |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |

#### committee_levels
Master data for committee engagement levels.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| name | varchar(50) | NOT NULL, UNIQUE |
| mandatory | boolean | NOT NULL, default false |
| display_order | integer | NOT NULL |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |

Committee level names: `mandatory`, `optional`, `not_necessary`

#### committee_thresholds
Budget thresholds determining committee engagement level.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| level_id | integer | NOT NULL, UNIQUE, FK -> committee_levels.id (ON DELETE RESTRICT) |
| max_amount | numeric(15,2) | nullable (null = unlimited) |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |

#### cost_tshirt_thresholds
Budget thresholds for T-shirt size classification.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| size | varchar(5) | NOT NULL (XS, S, M, L, XL, XXL) |
| max_amount | numeric(15,2) | NOT NULL |
| currency | varchar(3) | NOT NULL (ISO 4217) |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |

#### competence_month_patterns
Regex patterns for extracting competence months from invoice descriptions.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| company | varchar(10) | NOT NULL (THIF, EIL) |
| pattern | varchar(500) | NOT NULL |
| description | varchar(255) | nullable |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |

### Core Entity Tables

#### project_id_counters
Counter for generating sequential project IDs per year.

| Column | Type | Constraints |
|--------|------|-------------|
| year | integer | PK |
| last_id | integer | NOT NULL, default 0 |

#### projects
Core project entity containing all project data.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| project_id | varchar(20) | NOT NULL, UNIQUE (format: PRJ-YYYY-00001) |
| name | varchar(255) | NOT NULL |
| status_id | integer | FK -> statuses.id (ON DELETE RESTRICT) |
| start_date | date | nullable |
| end_date | date | nullable |
| lead_team_id | integer | NOT NULL, FK -> teams.id (ON DELETE RESTRICT) |
| project_manager | varchar(255) | nullable |
| is_owner | varchar(255) | nullable |
| sponsor | varchar(255) | nullable |
| description | text | nullable |
| is_stopped | boolean | NOT NULL, default false (deprecated) |
| previous_status_id | integer | FK -> statuses.id (ON DELETE SET NULL) |
| opex_budget | numeric(15,2) | nullable |
| capex_budget | numeric(15,2) | nullable |
| budget_currency | varchar(3) | nullable (ISO 4217) |
| report_currency | varchar(3) | nullable (GBP or EUR) |
| cost_tshirt | varchar(5) | nullable (auto-derived) |
| committee_state | varchar(20) | nullable |
| committee_level | varchar(20) | nullable (auto-derived from budget) |
| business_case_file | varchar(255) | nullable |
| version | integer | NOT NULL, default 1 (optimistic locking) |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |
| created_by | varchar(255) | nullable |
| updated_by | varchar(255) | nullable |
| imported_at | timestamp | nullable |
| import_source | varchar(100) | nullable |

Committee state values: `null`, `draft`, `presented`, `discussion`, `approved`, `rejected`

### Junction Tables

#### project_teams
Teams involved in a project with their effort sizing.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| project_id | integer | NOT NULL, FK -> projects.id (ON DELETE CASCADE) |
| team_id | integer | NOT NULL, FK -> teams.id (ON DELETE RESTRICT) |
| effort_size | varchar(5) | NOT NULL (XS/S/M/L/XL/XXL) |
| is_lead | boolean | NOT NULL, default false |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |

**Unique constraint:** (project_id, team_id)

#### project_values
Value scores for each project-outcome combination.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| project_id | integer | NOT NULL, FK -> projects.id (ON DELETE CASCADE) |
| outcome_id | integer | NOT NULL, FK -> outcomes.id (ON DELETE RESTRICT) |
| score | integer | nullable (1-5) |
| justification | text | nullable |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |

**Unique constraint:** (project_id, outcome_id)

#### project_change_impact
Teams impacted by project changes.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| project_id | integer | NOT NULL, FK -> projects.id (ON DELETE CASCADE) |
| team_id | integer | NOT NULL, FK -> teams.id (ON DELETE RESTRICT) |
| impact_size | varchar(5) | NOT NULL (XS/S/M/L/XL/XXL) |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |

**Unique constraint:** (project_id, team_id)

### Financial Tables

#### budget_lines
Imported budget line items from financial systems.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| company | varchar(10) | NOT NULL (THIF, EIL) |
| department_id | integer | NOT NULL, FK -> departments.id (ON DELETE RESTRICT) |
| cost_center_id | integer | NOT NULL, FK -> cost_centers.id (ON DELETE RESTRICT) |
| line_value | varchar(255) | NOT NULL |
| line_amount | numeric(15,2) | NOT NULL |
| currency | varchar(3) | NOT NULL (ISO 4217) |
| type | varchar(5) | NOT NULL (CAPEX or OPEX) |
| fiscal_year | integer | NOT NULL |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |

**Unique constraint:** (company, cost_center_id, line_value, fiscal_year)

#### project_budget_allocations
Links projects to their allocated budget lines.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| project_id | integer | NOT NULL, FK -> projects.id (ON DELETE CASCADE) |
| budget_line_id | integer | NOT NULL, FK -> budget_lines.id (ON DELETE RESTRICT) |
| allocation_amount | numeric(15,2) | NOT NULL |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |

**Unique constraint:** (project_id, budget_line_id)

#### receipts
Receipt actuals tracked against projects.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| project_id | integer | NOT NULL, FK -> projects.id (ON DELETE CASCADE) |
| receipt_number | varchar(100) | NOT NULL |
| company | varchar(100) | NOT NULL |
| purchase_order | varchar(100) | NOT NULL |
| amount | numeric(15,2) | NOT NULL |
| currency | varchar(3) | NOT NULL (ISO 4217) |
| receipt_date | date | NOT NULL |
| description | varchar(500) | nullable |
| import_batch | varchar(50) | nullable |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |

**Unique constraint:** (company, receipt_number)

#### invoices
Invoice actuals (company-level, optionally linked to projects).

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| project_id | integer | FK -> projects.id (ON DELETE SET NULL) |
| company | varchar(100) | NOT NULL |
| invoice_number | varchar(100) | NOT NULL |
| purchase_order | varchar(100) | NOT NULL |
| amount | numeric(15,2) | NOT NULL |
| currency | varchar(3) | NOT NULL (ISO 4217) |
| invoice_date | date | NOT NULL |
| description | varchar(500) | nullable |
| competence_month | varchar(7) | nullable (YYYY-MM format) |
| competence_month_extracted | boolean | NOT NULL, default false |
| competence_month_override | varchar(7) | nullable |
| import_batch | varchar(50) | nullable |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |

**Unique constraint:** (company, invoice_number)

### System Tables

#### audit_log
Tracks all changes to project fields.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| table_name | varchar(100) | NOT NULL |
| record_id | integer | NOT NULL |
| changed_by | varchar(255) | NOT NULL |
| changed_at | timestamp | NOT NULL, default now() |
| operation | varchar(10) | NOT NULL (INSERT, UPDATE, DELETE) |
| changes | jsonb | nullable (format: { field: { old: val, new: val } }) |
| created_at | timestamp | NOT NULL, default now() |

#### alert_config
Configuration for alert notifications.

| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK, auto-generated identity |
| type | varchar(50) | NOT NULL, UNIQUE |
| enabled | boolean | NOT NULL, default true |
| budget_threshold_percent | integer | nullable |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |

Alert types: `overdue`, `budget_limit`

## Entity Relationships

```
departments (1) ──────< (N) teams
     │
     └──────────────────< (N) budget_lines
                              │
                              └──────< (N) project_budget_allocations >──── (N) projects
                                                                                │
teams (N) >──────────────────────────────── project_teams ────────────────────<─┤
                                                                                │
teams (N) >──────────────────────────────── project_change_impact ────────────<─┤
                                                                                │
statuses (1) ──────────────────────────────────────────────────────────────────<┤
                                                                                │
outcomes (N) >──────────────────────────────── project_values ────────────────<─┤
                                                                                │
cost_centers (1) ───────────────< (N) budget_lines                              │
                                                                                │
committee_levels (1) ──< (1) committee_thresholds                               │
                                                                                │
                                                  receipts (N) >────────────────┤
                                                                                │
                                                  invoices (N) >────────────────┘
```

## Key Constraints

### Delete Behaviors
- **CASCADE:** When a project is deleted, its related records (project_teams, project_values, project_change_impact, project_budget_allocations, receipts) are automatically deleted
- **RESTRICT:** Reference data (departments, teams, statuses, outcomes, cost_centers, committee_levels) cannot be deleted if referenced by other records
- **SET NULL:** When a project is deleted, invoices linked to it have their project_id set to null

### Unique Constraints
- All reference tables have unique name/code columns
- Junction tables enforce unique combinations (project_id + related_id)
- Financial records enforce business uniqueness (company + identifier)

### Optimistic Locking
The `projects.version` column supports optimistic locking for concurrent edit detection.
