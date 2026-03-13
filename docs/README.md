# Eurostar Portfolio Tool Documentation

IT portfolio management system for tracking, prioritizing, and governing projects across the Information Systems department.

## Quick Links

| Area | Description |
|------|-------------|
| [Architecture](./architecture/README.md) | System design, components, database schema |
| [API](./api/README.md) | REST API endpoints and contracts |
| [Frontend](./frontend/README.md) | React SPA structure and components |
| [Backend](./backend/README.md) | Fastify server, routes, and services |
| [Import](./import/README.md) | Data import pipeline (ETL) |
| [Development](./development/README.md) | Setup, commands, environment |

## Documentation Principles

See [PRINCIPLES.md](./PRINCIPLES.md) for the documentation guidelines this project follows:
- **DRY**: Each concept documented once
- **Current State**: No roadmaps or changelogs
- **No Hardcoding**: Reference actual code

## Project Structure

```
eurostar-portfolio-gsd/
├── frontend/          # React SPA (Vite + TypeScript)
├── backend/           # Fastify REST API
├── import/            # ETL pipeline scripts
├── .planning/         # GSD planning documentation
└── docs/              # This documentation
```

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Radix UI |
| Backend | Fastify, TypeScript, Drizzle ORM, Zod |
| Database | PostgreSQL 16 |
| Auth | Microsoft Entra ID (MSAL) |
| DevOps | Docker, Make |

## Related Documentation

- `.planning/PROJECT.md` - Project overview and requirements
- `.planning/research/ARCHITECTURE.md` - Detailed architecture research
- `.planning/research/FEATURES.md` - Feature specifications
