# Available Commands

## Makefile Targets

Run `make help` to see all targets. Available commands:

### Development

| Command | Description |
|---------|-------------|
| `make dev` | Start backend and frontend dev servers concurrently |

### Database

| Command | Description |
|---------|-------------|
| `make db-push` | Push schema changes to database (drizzle-kit push) |
| `make db-reset` | Truncate all tables and seed essential data |
| `make db-demo-data` | Load demo data (departments, projects, etc.) |

### Data Import

| Command | Description |
|---------|-------------|
| `make import-extract` | Extract data from Excel to CSV staging files |
| `make import-validate` | Validate staging CSV files (schema + cross-CSV consistency) |
| `make import-load` | Load validated data to database |
| `make import-all` | Run full import pipeline (extract -> validate -> load) |
| `make import-dry-run` | Preview full import without database changes |
| `make import-help` | Show import tool help |

### Testing

| Command | Description |
|---------|-------------|
| `make test` | Run all tests (frontend + backend) |
| `make test-frontend` | Run frontend tests |
| `make test-backend` | Run backend tests |
| `make test-coverage` | Generate coverage reports for both packages |
| `make test-watch` | Instructions for running tests in watch mode |
| `make e2e` | Run E2E tests (requires backend running with DEV_MODE=true) |
| `make e2e-headed` | Run E2E tests with visible browser |

## npm Scripts

### Backend (`backend/`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled production server |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:demo-data` | Load demo data |
| `npm run db:reset` | Reset database and seed essential data |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:ui` | Run tests with Vitest UI |
| `npm run test:coverage` | Generate coverage report |

### Frontend (`frontend/`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:ui` | Run tests with Vitest UI |
| `npm run test:coverage` | Generate coverage report |
| `npm run e2e` | Run Playwright E2E tests |
| `npm run e2e:ui` | Run E2E tests with Playwright UI |
| `npm run e2e:headed` | Run E2E tests with visible browser |
| `npm run e2e:debug` | Run E2E tests in debug mode |
| `npm run e2e:visual` | Run visual regression tests |
| `npm run e2e:visual:update` | Update visual regression snapshots |

### Import (`import/`)

| Script | Description |
|--------|-------------|
| `npm run import` | Run import CLI |
| `npm run extract` | Extract Excel to CSV |
| `npm run validate` | Validate CSV files |
| `npm run load` | Load data to database |
| `npm run all` | Run full import pipeline |
| `npm run dry-run` | Preview import without database changes |

## Common Workflows

### Start Development

```bash
docker-compose up -d    # Start database
make dev                # Start backend and frontend
```

### Reset Database with Demo Data

```bash
make db-reset
make db-demo-data
```

### Run All Tests

```bash
make test
```

### Run E2E Tests

```bash
# Terminal 1: Start backend in dev mode
cd backend && DEV_MODE=true npm run dev

# Terminal 2: Run E2E tests
make e2e
```

### Import Data from Excel

```bash
make import-dry-run     # Preview changes first
make import-all         # Run full import
```
