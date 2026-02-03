# Architecture Research

**Domain:** IT Portfolio Management
**Researched:** 2026-02-03
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  Portfolio GUI   │  │   Admin GUI      │  │   Power BI Views     │  │
│  │  (Operations)    │  │  (Referentials)  │  │  (Snowflake Schema)  │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────┬───────────┘  │
│           │                     │                        │              │
├───────────┴─────────────────────┴────────────────────────┴──────────────┤
│                           API LAYER                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                       REST API Gateway                            │   │
│  │  ┌────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │   │
│  │  │  Projects  │  │   Budget    │  │  Workflow   │  │  Reports │ │   │
│  │  │  Endpoints │  │  Endpoints  │  │  Endpoints  │  │Endpoints │ │   │
│  │  └────────────┘  └─────────────┘  └─────────────┘  └──────────┘ │   │
│  └────────────────────────────┬─────────────────────────────────────┘   │
│                                │                                         │
├────────────────────────────────┴─────────────────────────────────────────┤
│                        BUSINESS LOGIC LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   Project    │  │  Financial   │  │  Workflow    │  │Referential │  │
│  │   Service    │  │  Service     │  │   Engine     │  │  Service   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│         │                  │                 │                │         │
├─────────┴──────────────────┴─────────────────┴────────────────┴─────────┤
│                         DATA ACCESS LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Repository Pattern                            │   │
│  │  ┌────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │   │
│  │  │  Project   │  │   Budget    │  │   Actuals   │  │Referential│ │   │
│  │  │Repository  │  │ Repository  │  │ Repository  │  │Repository │ │   │
│  │  └────────────┘  └─────────────┘  └─────────────┘  └──────────┘ │   │
│  └────────────────────────────┬─────────────────────────────────────┘   │
│                                │                                         │
├────────────────────────────────┴─────────────────────────────────────────┤
│                        DATA LAYER                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL Database                            │   │
│  │                                                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│  │  │ Operational  │  │   Snowflake  │  │  Referential │           │   │
│  │  │   Schema     │  │Schema (Views)│  │    Schema    │           │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │   │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                     AUTHENTICATION & SECURITY                            │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │        EntraID (Azure AD) → JWT Token Validation → RBAC           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Portfolio GUI** | User interface for portfolio operations (projects, budgets, actuals) | React/Vue SPA with TypeScript, API client |
| **Admin GUI** | Management interface for referential data (departments, teams, statuses, thresholds) | Separate SPA or integrated admin panel |
| **Power BI Views** | Read-only dimensional views exposing snowflake schema for reporting | SQL views mapped to fact/dimension tables |
| **REST API Gateway** | Single entry point, authentication, routing, rate limiting | Express.js/Fastify with middleware |
| **Project Service** | Project CRUD, lifecycle management, validation | TypeScript service classes with business logic |
| **Financial Service** | Budget tracking, actuals processing, variance calculation | TypeScript service handling financial calculations |
| **Workflow Engine** | Engagement Committee approval flow, state transitions | State machine pattern for approval routing |
| **Referential Service** | Master data management for all lookup tables | CRUD operations on referential entities |
| **Repository Layer** | Data access abstraction, query construction | TypeORM/Prisma with query builders |
| **Operational Schema** | Normalized OLTP schema for transactional operations | Standard 3NF PostgreSQL schema |
| **Snowflake Schema** | Denormalized dimensional views for BI/reporting | Read-only views with fact/dimension structure |
| **EntraID Integration** | SSO authentication, token validation, user context | MSAL library, JWT middleware |

## Recommended Project Structure

```
eurostar-portfolio/
├── apps/                           # Application layer
│   ├── api/                        # REST API application
│   │   ├── src/
│   │   │   ├── modules/            # Feature modules
│   │   │   │   ├── projects/       # Project management module
│   │   │   │   ├── budgets/        # Budget tracking module
│   │   │   │   ├── actuals/        # Actuals (receipts/invoices) module
│   │   │   │   ├── workflow/       # Engagement Committee workflow module
│   │   │   │   ├── referentials/   # Master data management module
│   │   │   │   └── reports/        # Reporting module
│   │   │   ├── common/             # Shared utilities
│   │   │   │   ├── middleware/     # Auth, logging, error handling
│   │   │   │   ├── guards/         # Authorization guards
│   │   │   │   └── interceptors/   # Request/response interceptors
│   │   │   ├── database/           # Database layer
│   │   │   │   ├── entities/       # ORM entities
│   │   │   │   ├── repositories/   # Data access repositories
│   │   │   │   ├── migrations/     # Schema migrations
│   │   │   │   └── views/          # Snowflake schema views (SQL)
│   │   │   ├── auth/               # Authentication module
│   │   │   │   ├── entra-id/       # EntraID integration
│   │   │   │   └── strategies/     # Auth strategies (JWT, OAuth)
│   │   │   └── main.ts             # Application entry point
│   │   ├── test/                   # API tests
│   │   └── package.json
│   ├── portfolio-gui/              # Portfolio operations GUI
│   │   ├── src/
│   │   │   ├── features/           # Feature-based structure
│   │   │   │   ├── projects/       # Project management UI
│   │   │   │   ├── budgets/        # Budget tracking UI
│   │   │   │   ├── actuals/        # Actuals entry UI
│   │   │   │   └── workflow/       # Committee approval UI
│   │   │   ├── components/         # Reusable components
│   │   │   ├── services/           # API client services
│   │   │   ├── store/              # State management
│   │   │   └── App.tsx
│   │   └── package.json
│   └── admin-gui/                  # Admin/referential GUI
│       ├── src/
│       │   ├── features/           # Admin features
│       │   │   ├── departments/    # Department management
│       │   │   ├── teams/          # Team management
│       │   │   ├── statuses/       # Status management
│       │   │   └── thresholds/     # Threshold configuration
│       │   ├── components/         # Admin UI components
│       │   └── App.tsx
│       └── package.json
├── packages/                       # Shared packages
│   ├── types/                      # Shared TypeScript types
│   │   └── src/
│   │       ├── entities/           # Entity interfaces
│   │       ├── dtos/               # Data transfer objects
│   │       └── enums/              # Shared enumerations
│   ├── api-client/                 # API client SDK
│   │   └── src/
│   │       ├── services/           # Type-safe API services
│   │       └── models/             # Request/response models
│   └── utils/                      # Shared utilities
│       └── src/
│           ├── validation/         # Validation helpers
│           ├── formatting/         # Data formatting
│           └── constants/          # Shared constants
├── infrastructure/                 # Infrastructure as code
│   ├── docker/                     # Docker configurations
│   │   ├── api.Dockerfile
│   │   ├── portfolio-gui.Dockerfile
│   │   ├── admin-gui.Dockerfile
│   │   └── docker-compose.yml      # Local development
│   ├── k8s/                        # Kubernetes manifests
│   │   ├── api/                    # API deployment
│   │   ├── guis/                   # GUI deployments
│   │   └── ingress/                # Load balancer config
│   └── azure/                      # Azure Container Apps config
├── database/                       # Database artifacts
│   ├── schema/                     # DDL scripts
│   │   ├── operational/            # OLTP schema
│   │   └── analytical/             # Snowflake views for Power BI
│   └── seeds/                      # Seed data for referentials
└── docs/                           # Documentation
    ├── api/                        # API documentation
    └── architecture/               # Architecture diagrams
```

### Structure Rationale

- **Monorepo approach:** Single repository with multiple apps and shared packages reduces duplication, ensures type safety across frontend/backend, and simplifies shared code management.
- **Feature-based modules:** Each domain (projects, budgets, actuals, workflow) is self-contained with its own controllers, services, and repositories, making the codebase easier to navigate and maintain.
- **Shared packages:** Common types, API client, and utilities are extracted to packages, enabling type safety between frontend and backend while avoiding code duplication.
- **Clear separation of concerns:** Presentation (GUIs) → API → Business Logic → Data Access → Database follows standard layered architecture principles.
- **Infrastructure as code:** Docker and Kubernetes configurations live alongside application code, supporting both local development and cloud deployment.
- **Database artifacts in version control:** Schema definitions and snowflake views are versioned, ensuring BI layer stays in sync with operational schema.

## Architectural Patterns

### Pattern 1: Repository Pattern for Data Access

**What:** Abstract data access logic behind repository interfaces, separating business logic from database operations.

**When to use:** Always in TypeScript applications with ORMs (TypeORM, Prisma). Enables testability, schema evolution, and potential data source switching.

**Trade-offs:**
- **Pro:** Clear separation, easy to mock for testing, encapsulates query complexity
- **Con:** Additional abstraction layer, potential performance overhead if overused

**Example:**
```typescript
// Repository interface
interface IProjectRepository {
  findById(id: string): Promise<Project | null>;
  findAll(filter?: ProjectFilter): Promise<Project[]>;
  create(project: CreateProjectDto): Promise<Project>;
  update(id: string, updates: Partial<Project>): Promise<Project>;
  delete(id: string): Promise<void>;
}

// Implementation with TypeORM
class ProjectRepository implements IProjectRepository {
  constructor(private readonly entityManager: EntityManager) {}

  async findById(id: string): Promise<Project | null> {
    return this.entityManager.findOne(Project, {
      where: { id },
      relations: ['department', 'team', 'budgetLines']
    });
  }

  // ... other methods
}

// Service uses repository, not ORM directly
class ProjectService {
  constructor(private readonly projectRepo: IProjectRepository) {}

  async getProject(id: string): Promise<ProjectDto> {
    const project = await this.projectRepo.findById(id);
    if (!project) throw new NotFoundException();
    return this.toDto(project);
  }
}
```

### Pattern 2: State Machine for Workflow Engine

**What:** Model Engagement Committee approval workflow as a state machine with defined states, transitions, and guards.

**When to use:** Any approval or lifecycle workflow with complex state transitions. Essential for portfolio management systems with committee review processes.

**Trade-offs:**
- **Pro:** Explicit state transitions prevent invalid states, easy to visualize, testable
- **Con:** Can be overkill for simple linear workflows, requires upfront design

**Example:**
```typescript
// Workflow states
enum ProjectWorkflowState {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CHANGES_REQUESTED = 'changes_requested'
}

// State machine definition
interface StateTransition {
  from: ProjectWorkflowState;
  to: ProjectWorkflowState;
  guard?: (project: Project, user: User) => boolean;
  action?: (project: Project) => Promise<void>;
}

const transitions: StateTransition[] = [
  {
    from: ProjectWorkflowState.DRAFT,
    to: ProjectWorkflowState.SUBMITTED,
    guard: (project) => project.isValid(),
    action: async (project) => {
      await notifyCommittee(project);
    }
  },
  {
    from: ProjectWorkflowState.SUBMITTED,
    to: ProjectWorkflowState.UNDER_REVIEW,
    guard: (_, user) => user.hasRole('COMMITTEE_MEMBER')
  },
  // ... other transitions
];

class WorkflowEngine {
  async transition(
    project: Project,
    toState: ProjectWorkflowState,
    user: User
  ): Promise<void> {
    const transition = transitions.find(
      t => t.from === project.state && t.to === toState
    );

    if (!transition) {
      throw new InvalidTransitionError();
    }

    if (transition.guard && !transition.guard(project, user)) {
      throw new UnauthorizedTransitionError();
    }

    if (transition.action) {
      await transition.action(project);
    }

    project.state = toState;
    await this.projectRepo.update(project.id, { state: toState });
  }
}
```

### Pattern 3: Snowflake Schema Views for BI

**What:** Create read-only SQL views that expose operational data in a dimensional model (snowflake schema) specifically for Power BI consumption.

**When to use:** When BI tools need to consume transactional data in a dimensional format without maintaining a separate data warehouse.

**Trade-offs:**
- **Pro:** No ETL pipeline needed, always up-to-date, single source of truth
- **Con:** Query performance depends on operational database, limited historical tracking

**Example:**
```sql
-- Fact table: Project actuals
CREATE OR REPLACE VIEW bi.fact_project_actuals AS
SELECT
    a.id AS actual_id,
    a.project_id,
    a.budget_line_id,
    a.department_id,
    a.team_id,
    a.status_id,
    a.date AS date_key,
    a.amount,
    a.type, -- 'receipt' or 'invoice'
    a.created_at,
    a.updated_at
FROM actuals a;

-- Dimension: Project
CREATE OR REPLACE VIEW bi.dim_project AS
SELECT
    p.id AS project_id,
    p.name AS project_name,
    p.code AS project_code,
    p.description,
    p.start_date,
    p.end_date,
    p.department_id,
    d.name AS department_name,
    p.team_id,
    t.name AS team_name,
    p.status_id,
    s.name AS status_name,
    s.category AS status_category
FROM projects p
LEFT JOIN departments d ON p.department_id = d.id
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN statuses s ON p.status_id = s.id;

-- Dimension: Budget line
CREATE OR REPLACE VIEW bi.dim_budget_line AS
SELECT
    bl.id AS budget_line_id,
    bl.name AS budget_line_name,
    bl.code AS budget_line_code,
    bl.allocated_amount,
    bl.category,
    bl.project_id
FROM budget_lines bl;

-- Dimension: Department (normalized dimension)
CREATE OR REPLACE VIEW bi.dim_department AS
SELECT
    d.id AS department_id,
    d.name AS department_name,
    d.code AS department_code,
    d.parent_department_id,
    pd.name AS parent_department_name
FROM departments d
LEFT JOIN departments pd ON d.parent_department_id = pd.id;

-- Dimension: Team (normalized dimension)
CREATE OR REPLACE VIEW bi.dim_team AS
SELECT
    t.id AS team_id,
    t.name AS team_name,
    t.code AS team_code,
    t.department_id
FROM teams t;

-- Date dimension (pre-built for time intelligence)
CREATE OR REPLACE VIEW bi.dim_date AS
SELECT
    date::date AS date_key,
    EXTRACT(YEAR FROM date) AS year,
    EXTRACT(QUARTER FROM date) AS quarter,
    EXTRACT(MONTH FROM date) AS month,
    EXTRACT(WEEK FROM date) AS week,
    EXTRACT(DAY FROM date) AS day,
    TO_CHAR(date, 'Month') AS month_name,
    TO_CHAR(date, 'Day') AS day_name
FROM generate_series(
    '2020-01-01'::date,
    '2030-12-31'::date,
    '1 day'::interval
) AS date;
```

### Pattern 4: Module-Based API Structure

**What:** Organize API endpoints by domain module (projects, budgets, actuals, workflow) with each module containing its own routes, controllers, services, and repositories.

**When to use:** Medium to large APIs where a flat structure becomes hard to navigate. Essential for team collaboration.

**Trade-offs:**
- **Pro:** Clear ownership, easier to find code, supports team autonomy
- **Con:** Potential duplication between modules, requires discipline to maintain boundaries

**Example:**
```typescript
// apps/api/src/modules/projects/projects.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Project, Department, Team])],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectRepository],
  exports: [ProjectsService] // Other modules can inject ProjectsService
})
export class ProjectsModule {}

// apps/api/src/modules/projects/projects.controller.ts
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async findAll(@Query() filter: ProjectFilterDto): Promise<ProjectDto[]> {
    return this.projectsService.findAll(filter);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProjectDto> {
    return this.projectsService.findOne(id);
  }

  @Post()
  @RequireRole('PROJECT_MANAGER')
  async create(@Body() dto: CreateProjectDto): Promise<ProjectDto> {
    return this.projectsService.create(dto);
  }
}

// Main application imports all modules
@Module({
  imports: [
    ProjectsModule,
    BudgetsModule,
    ActualsModule,
    WorkflowModule,
    ReferentialsModule,
    ReportsModule
  ]
})
export class AppModule {}
```

## Data Flow

### Request Flow: Portfolio Operations

```
[User Action in Portfolio GUI]
    ↓
[API Client (Type-safe)] → POST /api/projects
    ↓
[API Gateway] → JWT Token Validation (EntraID)
    ↓
[Projects Controller] → Validates DTO, extracts user context
    ↓
[Projects Service] → Business logic, authorization checks
    ↓
[Project Repository] → ORM query construction
    ↓
[PostgreSQL] → Transaction, constraint validation
    ↓
[Project Repository] ← Returns entity
    ↓
[Projects Service] ← Maps to DTO
    ↓
[Projects Controller] ← Returns response
    ↓
[API Client] ← Receives typed response
    ↓
[Portfolio GUI] ← Updates UI state
```

### Request Flow: Engagement Committee Workflow

```
[Project Manager submits project]
    ↓
[Workflow Service] → transition(project, 'submitted')
    ↓
[State Machine] → Validates transition, checks guards
    ↓
[Workflow Repository] → Updates project state, creates audit log
    ↓
[Notification Service] ← Triggers committee notification
    ↓
[Email/Teams Alert] → Committee members notified
    ↓
[Committee Member logs in]
    ↓
[Portfolio GUI] → Fetches pending approvals
    ↓
[Workflow Service] → Returns projects in 'submitted' state
    ↓
[Committee Member approves]
    ↓
[Workflow Service] → transition(project, 'approved')
    ↓
[State Machine] → Executes approval action
    ↓
[Project Repository] → Updates project status, records approver
    ↓
[Notification Service] → Notifies project manager of approval
```

### Data Flow: Power BI Reporting

```
[Power BI Desktop/Service]
    ↓
[PostgreSQL Connection] → Connects to database
    ↓
[Query bi.fact_project_actuals] → Reads from snowflake view
    ↓
[View joins operational tables] → Project → Department → Team
    ↓
[Aggregates data] → SUM(amount) GROUP BY department, month
    ↓
[Returns result set] ← Flattened dimensional data
    ↓
[Power BI] ← Renders dashboard
    ↓
[Executive views portfolio metrics]
```

### State Management in Frontend

```
[Component Action] (e.g., "Create Project")
    ↓
[API Service Call] → POST /api/projects
    ↓
[API Response] ← Returns new project
    ↓
[State Store Action] → ADD_PROJECT
    ↓
[Reducer/Mutation] → Updates state.projects[]
    ↓
[Component Re-renders] ← Subscribed to store
    ↓
[UI displays new project]
```

### Key Data Flows

1. **Project Lifecycle:** Draft → Submitted → Under Review → Approved/Rejected. Each transition validated by Workflow Engine, logged for audit, triggers notifications.

2. **Budget Tracking:** Budget Lines created → Actuals (receipts/invoices) recorded → Variance calculated → Alerts triggered if threshold exceeded → Committee reviews.

3. **Referential Data Cascade:** Departments created in Admin GUI → Teams associated with departments → Projects assigned to teams → Reports grouped by department hierarchy.

4. **BI Data Refresh:** Operational tables updated → Snowflake views reflect changes immediately → Power BI scheduled refresh queries views → Dashboard displays latest data.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-100 users** | Monolithic deployment fine. Single server for API + GUIs, single PostgreSQL instance. Docker Compose for local dev, Azure Container Apps for production. |
| **100-1000 users** | Separate API and GUI deployments. Add read replica for PostgreSQL (Power BI queries hit replica). Implement caching layer (Redis) for referential data. Scale horizontally (2-3 API instances behind load balancer). |
| **1000-10,000 users** | Microservices consideration: Extract Workflow Engine and Financial Service if they become bottlenecks. Database partitioning by year for actuals table. CDN for static assets. Consider Azure API Management for rate limiting and analytics. |
| **10,000+ users** | Full microservices architecture. Event-driven architecture (Azure Service Bus) for workflow notifications. Separate OLAP database for BI (ETL from OLTP). Implement CQRS if read/write patterns diverge significantly. |

### Scaling Priorities

1. **First bottleneck (100-500 users):** Database query performance. Power BI queries on snowflake views can be expensive.
   - **Fix:** Add read replica, index optimization, query result caching, scheduled snapshots for historical data.

2. **Second bottleneck (500-2000 users):** Stateless API concurrent requests. Single API instance struggles under load.
   - **Fix:** Horizontal scaling (multiple API instances), load balancer, stateless authentication (JWT), session stored client-side.

3. **Third bottleneck (2000-5000 users):** Workflow notifications and email volume.
   - **Fix:** Extract notification service, use message queue (Azure Service Bus), batch notifications, throttle email sending.

4. **Fourth bottleneck (5000+ users):** Reporting queries competing with operational workload.
   - **Fix:** Separate analytical database, nightly ETL, consider dedicated BI-optimized store (Azure Synapse).

## Anti-Patterns

### Anti-Pattern 1: Tight Coupling Between GUIs and Database Schema

**What people do:** Frontend directly mirrors database schema, exposing internal structure in DTOs, making schema changes break UI.

**Why it's wrong:** Database refactoring requires coordinated frontend changes, business logic leaks into UI, difficult to evolve independently.

**Do this instead:** Use DTOs and ViewModels that represent UI needs, not database structure. Service layer maps between domain entities and DTOs. This allows independent evolution of database schema and UI contracts.

```typescript
// ❌ BAD: Exposing internal structure
interface ProjectDto {
  id: string;
  department_id: string; // Database column name
  team_id: string;
  status_id: string;
  budget_lines: BudgetLine[]; // Direct entity exposure
}

// ✅ GOOD: UI-focused contract
interface ProjectDto {
  id: string;
  name: string;
  department: { id: string; name: string }; // Nested, UI-friendly
  team: { id: string; name: string };
  status: { id: string; name: string; color: string };
  budgetSummary: {
    allocated: number;
    spent: number;
    remaining: number;
  };
}
```

### Anti-Pattern 2: God Service with All Business Logic

**What people do:** Create a single massive `PortfolioService` that handles projects, budgets, actuals, workflows, and referentials, growing to thousands of lines.

**Why it's wrong:** Impossible to test, circular dependencies, merge conflicts, unclear ownership, performance issues (loads everything).

**Do this instead:** Domain-driven service boundaries. Each domain (Project, Budget, Actual, Workflow, Referential) has its own service. Services can depend on each other through well-defined interfaces.

```typescript
// ❌ BAD: God service
class PortfolioService {
  createProject() {}
  updateProject() {}
  createBudgetLine() {}
  recordActual() {}
  submitForApproval() {}
  approvProject() {}
  manageDepartments() {}
  // ... 50 more methods
}

// ✅ GOOD: Bounded services
class ProjectService {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly budgetService: BudgetService
  ) {}

  async createProject(dto: CreateProjectDto): Promise<Project> {
    // Project creation logic only
  }

  async submitForApproval(projectId: string): Promise<void> {
    await this.workflowService.transition(projectId, 'submitted');
  }
}

class BudgetService {
  async createBudgetLine(dto: CreateBudgetLineDto): Promise<BudgetLine> {
    // Budget logic only
  }
}

class WorkflowService {
  async transition(projectId: string, toState: WorkflowState): Promise<void> {
    // Workflow logic only
  }
}
```

### Anti-Pattern 3: N+1 Queries in Snowflake Views

**What people do:** Write snowflake views with many LEFT JOINs that cause query planner to execute sequential queries rather than batch.

**Why it's wrong:** Power BI reports take minutes to load, database CPU spikes, reports timeout, poor user experience.

**Do this instead:** Optimize views with proper indexes, use materialized views for expensive aggregations, implement incremental refresh strategies, monitor query execution plans.

```sql
-- ❌ BAD: Unoptimized view
CREATE VIEW bi.fact_project_actuals AS
SELECT
    a.*,
    (SELECT name FROM projects WHERE id = a.project_id) AS project_name,
    (SELECT name FROM departments WHERE id = a.department_id) AS dept_name,
    (SELECT name FROM teams WHERE id = a.team_id) AS team_name
FROM actuals a; -- Causes N+1 queries

-- ✅ GOOD: Proper joins with indexes
CREATE VIEW bi.fact_project_actuals AS
SELECT
    a.id,
    a.amount,
    a.date,
    p.name AS project_name,
    d.name AS department_name,
    t.name AS team_name
FROM actuals a
LEFT JOIN projects p ON a.project_id = p.id
LEFT JOIN departments d ON a.department_id = d.id
LEFT JOIN teams t ON a.team_id = t.id;

-- Ensure indexes exist
CREATE INDEX idx_actuals_project_id ON actuals(project_id);
CREATE INDEX idx_actuals_department_id ON actuals(department_id);
CREATE INDEX idx_actuals_team_id ON actuals(team_id);
```

### Anti-Pattern 4: Storing Workflow State as Boolean Flags

**What people do:** Use multiple boolean columns (`is_submitted`, `is_approved`, `is_rejected`) to track workflow state, leading to invalid states like `is_approved=true AND is_rejected=true`.

**Why it's wrong:** No single source of truth for state, invalid states possible, transition logic scattered, audit trail unclear.

**Do this instead:** Use a single state enum column, implement state machine pattern, store state history in separate audit table.

```typescript
// ❌ BAD: Boolean flags
interface Project {
  id: string;
  is_draft: boolean;
  is_submitted: boolean;
  is_under_review: boolean;
  is_approved: boolean;
  is_rejected: boolean;
  // What if is_approved and is_rejected are both true?
}

// ✅ GOOD: Single state enum
enum ProjectState {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

interface Project {
  id: string;
  state: ProjectState; // Single source of truth
}

// Audit trail in separate table
interface ProjectStateHistory {
  id: string;
  project_id: string;
  from_state: ProjectState;
  to_state: ProjectState;
  changed_by: string;
  changed_at: Date;
  reason?: string;
}
```

### Anti-Pattern 5: Frontend Duplicating Backend Validation

**What people do:** Write the same validation logic in both frontend and backend, inevitably leading to drift where validation rules differ.

**Why it's wrong:** Inconsistent validation, security risk (bypass frontend validation via API), maintenance burden (update in two places).

**Do this instead:** Backend is source of truth for validation. Frontend uses generated types and schema from backend, validates against same rules via shared package, provides user-friendly errors.

```typescript
// ✅ GOOD: Shared validation schema
// packages/types/src/validation/project.schema.ts
import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string().min(3).max(100),
  code: z.string().regex(/^[A-Z]{3}-\d{4}$/),
  departmentId: z.string().uuid(),
  teamId: z.string().uuid(),
  budget: z.number().positive()
});

export type CreateProjectDto = z.infer<typeof CreateProjectSchema>;

// Backend uses schema
// apps/api/src/modules/projects/projects.controller.ts
@Post()
async create(@Body() dto: CreateProjectDto) {
  const validated = CreateProjectSchema.parse(dto); // Throws if invalid
  return this.projectsService.create(validated);
}

// Frontend uses same schema
// apps/portfolio-gui/src/features/projects/CreateProjectForm.tsx
const form = useForm<CreateProjectDto>({
  resolver: zodResolver(CreateProjectSchema) // Same validation!
});
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **EntraID (Azure AD)** | OAuth 2.0 / MSAL library | JWT token validation on every API request. Token contains user identity and roles. Refresh tokens handled by frontend. |
| **Power BI** | Direct PostgreSQL connection | Power BI connects to `bi.*` schema views. Use read-only user credentials. Schedule refresh (daily/hourly). Consider row-level security. |
| **Email (SMTP)** | Async notification queue | Workflow transitions trigger emails. Use Azure Communication Services or SendGrid. Queue messages to avoid blocking requests. |
| **Azure Container Apps** | Docker image deployment | API and GUIs deployed as separate container apps. Use Azure Container Registry. Environment variables for secrets. |
| **Azure Storage** | Document attachments (optional) | If projects have attachments (receipts, invoices), store in Blob Storage. API stores URLs in database. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Portfolio GUI ↔ API** | REST API (JSON over HTTPS) | Type-safe API client generated from OpenAPI spec or shared TypeScript types. JWT auth on every request. |
| **Admin GUI ↔ API** | REST API (JSON over HTTPS) | Same API, different endpoints (`/api/referentials/*`). Requires admin role. |
| **Project Service ↔ Workflow Service** | Direct method calls (same process) | In monolithic architecture, services call each other directly. In microservices, would be HTTP or message queue. |
| **Workflow Service ↔ Notification Service** | Event-driven (optional) | For async notifications. Workflow emits events, notification service subscribes. Can start synchronously. |
| **API ↔ PostgreSQL** | TypeORM/Prisma (connection pool) | Connection pool size based on concurrent users. Migrations managed via ORM. Read replica for reports. |
| **Power BI ↔ PostgreSQL** | Direct SQL queries | Power BI uses `bi.*` schema views. No application layer involved. Consider query timeouts and caching. |

## Build Order and Dependencies

### Phase 1: Foundation (Must be first)

**Build these first:**
1. **Database schema (operational):** Tables for projects, departments, teams, statuses, budget lines, actuals.
2. **Shared types package:** TypeScript interfaces for all entities, DTOs, enums.
3. **Authentication setup:** EntraID integration, JWT middleware, basic auth guards.

**Why first:** Everything depends on these. Can't build services without entities, can't test APIs without auth.

**Estimated effort:** 1-2 weeks

### Phase 2: Core API (Depends on Phase 1)

**Build these next:**
4. **Referentials module:** CRUD for departments, teams, statuses, thresholds (simpler domain).
5. **Projects module:** CRUD for projects (core entity).
6. **Repository layer:** Data access for above entities.

**Why second:** Establishes API structure patterns. Referentials are simpler and test architecture. Projects are core entity.

**Estimated effort:** 2-3 weeks

### Phase 3: Financial Tracking (Depends on Phase 2)

**Build these next:**
7. **Budgets module:** Budget lines CRUD.
8. **Actuals module:** Receipts and invoices recording.
9. **Financial calculations:** Variance, budget utilization, threshold checks.

**Why third:** Builds on projects (must exist first). Financial logic is complex and benefits from established patterns.

**Estimated effort:** 2-3 weeks

### Phase 4: Workflow Engine (Depends on Phase 2, 3)

**Build these next:**
10. **Workflow module:** State machine, transitions, guards.
11. **Engagement Committee flow:** Submission, review, approval, rejection.
12. **Notification service:** Email alerts for workflow events.
13. **Audit logging:** Track all state changes.

**Why fourth:** Depends on projects and budgets being complete. Workflow ties everything together. Most complex business logic.

**Estimated effort:** 2-3 weeks

### Phase 5: BI Layer (Depends on all operational data)

**Build these next:**
14. **Snowflake schema views:** Fact and dimension views in `bi.*` schema.
15. **Power BI connection:** Test queries, optimize performance.
16. **Sample reports:** Basic dashboards to validate data structure.

**Why fifth:** Requires complete operational schema. Query optimization needs real data patterns. Can iterate as more data accumulates.

**Estimated effort:** 1-2 weeks

### Phase 6: Frontend (Can start parallel after Phase 2)

**Build these next:**
17. **API client package:** Type-safe client for frontend.
18. **Admin GUI:** Referentials management (simpler UI, tests patterns).
19. **Portfolio GUI:** Projects, budgets, actuals, workflow UI.

**Why sixth:** Frontend can start after core API exists. Admin GUI is simpler and tests architecture. Portfolio GUI is most complex.

**Estimated effort:** 3-4 weeks

### Dependency Graph

```
Phase 1: Foundation
  ├── Database schema
  ├── Shared types
  └── Auth setup
        ↓
Phase 2: Core API
  ├── Referentials module (depends on: types, auth, schema)
  └── Projects module (depends on: types, auth, schema, referentials)
        ↓
Phase 3: Financial
  ├── Budgets module (depends on: projects)
  └── Actuals module (depends on: budgets, projects)
        ↓
Phase 4: Workflow
  ├── Workflow engine (depends on: projects, actuals)
  ├── Engagement Committee (depends on: workflow engine)
  └── Notifications (depends on: workflow engine)
        ↓
Phase 5: BI Layer
  └── Snowflake views (depends on: all operational modules)
        ↓
Phase 6: Frontend (can start after Phase 2)
  ├── API client (depends on: API endpoints exist)
  ├── Admin GUI (depends on: API client, referentials API)
  └── Portfolio GUI (depends on: API client, all API modules)
```

**Critical path:** Phase 1 → Phase 2 → Phase 4 → Phase 6 (approximately 8-12 weeks minimum)

**Parallelization opportunities:**
- Phase 3 (Financial) can overlap with Phase 4 (Workflow) if team has 2+ backend developers.
- Phase 6 (Frontend) can start as soon as Phase 2 completes, running parallel to Phase 3-5.
- Phase 5 (BI Layer) can be deferred to later if reporting isn't launch-critical.

**Key risk:** Workflow Engine (Phase 4) is most complex and blocks frontend completion. Budget extra time here.

## Sources

### Architecture Research
- [Enterprise Project Portfolio Management Explained [2026 Guide] - Epicflow](https://www.epicflow.com/blog/enterprise-project-portfolio-management/)
- [Smartsheet: Enterprise Project Portfolio Management (EPPM)](https://www.smartsheet.com/content/enterprise-project-portfolio-management)
- [A New Model for Portfolio Monitoring and Management for 2026 | Workiva](https://www.workiva.com/resources/new-model-portfolio-monitoring-and-management-2026)

### Component Boundaries & Microservices
- [Boundaries: The Real Foundation of Any Modern Architecture - DEV Community](https://dev.to/dinesh_dunukedeniya_539a3/boundaries-the-real-foundation-of-any-modern-architecture-microservices-or-otherwise-26a)
- [Modular Monolith: 42% Ditch Microservices in 2026 | byteiota](https://byteiota.com/modular-monolith-42-ditch-microservices-in-2026/)
- [Microservices vs Monoliths in 2026: When Each Architecture Wins - Java Code Geeks](https://www.javacodegeeks.com/2025/12/microservices-vs-monoliths-in-2026-when-each-architecture-wins.html)

### REST API Design Patterns
- [Mastering REST API Design: Essential Best Practices, Do's and Don'ts for 2026](https://medium.com/@syedabdullahrahman/mastering-rest-api-design-essential-best-practices-dos-and-don-ts-for-2024-dd41a2c59133)
- [Web API Design Best Practices - Azure Architecture Center | Microsoft Learn](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design)
- [Patterns for API Design](https://microservice-api-patterns.org/)

### Workflow & Approval Systems
- [Process Approvals | REST API Developer Guide | Salesforce Developers](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_process_approvals.htm)
- [Approvals app API overview - Microsoft Graph](https://learn.microsoft.com/en-us/graph/approvals-app-api)

### Authentication (EntraID)
- [Microsoft Entra REST API - authentication | Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-app-configuration/rest-api-authentication-azure-ad)
- [Build API clients for TypeScript with Microsoft identity authentication | Microsoft Learn](https://learn.microsoft.com/en-us/openapi/kiota/tutorials/typescript-azure)

### Power BI Integration
- [Deliver Engaging Portfolio Reports With Power BI | Info-Tech Research Group](https://www.infotech.com/research/ss/deliver-engaging-portfolio-reports-with-power-bi)
- [Enterprise Power BI Development: Scalable Data Architecture | Multishoring](https://multishoring.com/blog/enterprise-power-bi-development-why-scalable-data-architecture-matters-for-cios/)
- [BI solution architecture in the Center of Excellence - Power BI | Microsoft Learn](https://learn.microsoft.com/en-us/power-bi/guidance/center-of-excellence-business-intelligence-solution-architecture)

### Dimensional Modeling
- [Star Schema vs Snowflake Schema: Differences & Use Cases | DataCamp](https://www.datacamp.com/blog/star-schema-vs-snowflake-schema)
- [Understand star schema and the importance for Power BI - Power BI | Microsoft Learn](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema)
- [Star Schema vs Snowflake Schema: Key Differences & Examples](https://www.fivetran.com/learn/star-schema-vs-snowflake)

### Financial Module Architecture
- [Best IT Portfolio Management Software 2026: A Complete Guide](https://www.bigtime.net/blogs/it-portfolio-management-software/)
- [Top 6 AI‑Powered Strategic Portfolio Management Platforms for 2026](https://planisware.com/resources/strategic-planning-alignment/what-top-6-ai-strategic-portfolio-management-platforms)

### Data Architecture
- [How Data Portfolio Management Enhances Your Enterprise Architecture](https://www.boc-group.com/en/blog/ea/how-data-portfolio-management-enhances-your-enterprise-architecture-and-drives-growth/)
- [Financial Services Investment Management Reference Architecture | Databricks](https://www.databricks.com/resources/architectures/financial-services-investment-management-reference-architecture)

---
*Architecture research for: IT Portfolio Management System*
*Researched: 2026-02-03*
*Confidence: MEDIUM - Based on industry patterns, official Microsoft documentation, and recent architectural trends. Specific patterns verified through multiple sources. Eurostar-specific requirements may require adjustments.*
