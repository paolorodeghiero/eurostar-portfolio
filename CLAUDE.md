# Eurostar Portfolio Tool

IT portfolio management system for tracking, prioritizing, and governing projects.

## Documentation

Project documentation is located in `docs/`:

- [docs/README.md](docs/README.md) - Documentation index
- [docs/PRINCIPLES.md](docs/PRINCIPLES.md) - Documentation guidelines
- [docs/architecture/](docs/architecture/) - System architecture
- [docs/api/](docs/api/) - REST API reference
- [docs/frontend/](docs/frontend/) - React SPA documentation
- [docs/backend/](docs/backend/) - Fastify server documentation
- [docs/import/](docs/import/) - Data import pipeline
- [docs/development/](docs/development/) - Development setup

## Quick Commands

```bash
make dev              # Start backend + frontend
make db-reset         # Reset database
make db-demo-data     # Load demo data
make import-all       # Run full import pipeline
make test             # Run all tests
```

## Project Structure

```
eurostar-portfolio-gsd/
├── frontend/          # React SPA (Vite + TypeScript)
├── backend/           # Fastify REST API
├── import/            # ETL pipeline scripts
├── docs/              # Project documentation
└── .planning/         # GSD planning files
```

## Development Guidelines

### Code Style
- TypeScript throughout (frontend + backend)
- Zod for validation
- Drizzle ORM for database
- Tailwind CSS for styling

### Documentation Updates
When modifying code, consider updating:
- `docs/api/` for API endpoint changes
- `docs/architecture/database.md` for schema changes
- `docs/frontend/components.md` for new components
- `docs/backend/routes.md` for new routes

### Testing
- Frontend: Vitest + React Testing Library + Playwright
- Backend: Vitest

## Planning

GSD framework planning files are in `.planning/`:
- `PROJECT.md` - Project overview and requirements
- `ROADMAP.md` - Feature roadmap
- `phases/` - Implementation phases
- `debug/` - Resolved debug sessions
