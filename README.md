# Eurostar Portfolio Tool

IT portfolio management system for tracking, prioritizing, and governing projects across the Information Systems department.

## Features

- **Portfolio Dashboard** — View all projects with filtering, sorting, and column customization
- **Project Management** — Create, edit, and track project lifecycle from intake to completion
- **Cost Tracking** — Budget management with multi-currency support and actuals import
- **Committee Governance** — Automatic committee level assignment based on cost thresholds
- **Admin Console** — Manage departments, teams, statuses, outcomes, and reference data
- **Audit Trail** — Full history of all changes with user attribution

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Radix UI, TanStack Table |
| Backend | Fastify, TypeScript, Drizzle ORM, Zod |
| Database | PostgreSQL 16 |
| Auth | Microsoft Entra ID (MSAL) / Dev Mode |
| Testing | Vitest, Playwright, React Testing Library |
| DevOps | Docker, GitHub Actions, Make |

## Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL 16+ (or Docker)
- Make

### Setup

```bash
# Clone and install
git clone <repository-url>
cd eurostar-portfolio-gsd

# Start PostgreSQL
docker compose up -d

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Setup database
cd ../backend
cp .env.example .env
npm run db:push
npm run db:seed

# Start development servers
cd ..
make dev
```

### Access

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Dev Mode**: Set `DEV_MODE=true` in backend `.env` to bypass authentication

## Commands

```bash
# Development
make dev              # Start backend + frontend
make dev-backend      # Start backend only
make dev-frontend     # Start frontend only

# Database
make db-reset         # Drop and recreate database
make db-seed          # Seed with initial data
make db-demo-data     # Load demo projects

# Import
make import-all       # Run full import pipeline
make import-actuals   # Import cost actuals from Excel

# Testing
make test             # Run all unit/integration tests
make e2e              # Run E2E tests (requires backend running)
make visual           # Run visual regression tests
make test-all         # Full CI test suite locally

# Utilities
make lint             # Run linters
make typecheck        # Run TypeScript checks
```

## Project Structure

```
eurostar-portfolio-gsd/
├── frontend/              # React SPA
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── lib/           # API client, utilities
│   │   └── types/         # TypeScript types
│   ├── e2e/               # Playwright E2E tests
│   └── e2e/visual/        # Visual regression tests
├── backend/               # Fastify REST API
│   ├── src/
│   │   ├── db/            # Drizzle schema and migrations
│   │   ├── routes/        # API route handlers
│   │   └── lib/           # Business logic
│   └── src/__tests__/     # API and unit tests
├── import/                # ETL pipeline scripts
│   └── actuals/           # Cost actuals import
├── docs/                  # Project documentation
└── .planning/             # GSD planning files
```

## Documentation

| Document | Description |
|----------|-------------|
| [docs/](docs/README.md) | Full documentation index |
| [docs/architecture/](docs/architecture/) | System design and database schema |
| [docs/api/](docs/api/) | REST API reference |
| [docs/frontend/](docs/frontend/) | React components and state |
| [docs/backend/](docs/backend/) | Routes and services |
| [docs/development/](docs/development/) | Setup and environment |

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/eurostar_portfolio

# Authentication
DEV_MODE=true                    # Bypass auth for development
AZURE_CLIENT_ID=                 # Microsoft Entra ID client
AZURE_TENANT_ID=                 # Microsoft Entra ID tenant

# Server
PORT=3000
HOST=0.0.0.0
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:3000
VITE_MSAL_CLIENT_ID=             # Microsoft Entra ID client
VITE_MSAL_AUTHORITY=             # Microsoft Entra ID authority
```

## Testing

The project includes comprehensive test coverage:

- **Unit Tests**: Vitest for backend business logic and frontend utilities
- **Integration Tests**: API tests with Fastify injection and test database
- **Component Tests**: React Testing Library with MSW for API mocking
- **E2E Tests**: Playwright tests for critical user journeys
- **Visual Regression**: Screenshot comparison for all pages

```bash
# Run specific test suites
npm test                    # Unit/integration tests
npm run e2e                 # E2E tests
npm run e2e:visual          # Visual regression
npm run e2e:visual:update   # Update visual baselines
```

## CI/CD

GitHub Actions runs on every PR:
1. **Unit & Integration Tests** — Backend and frontend with PostgreSQL
2. **E2E Tests** — Playwright with full stack
3. **Visual Regression** — Screenshot comparison
4. **Coverage Reports** — Posted to Codecov

## License

Proprietary - Eurostar International Limited
