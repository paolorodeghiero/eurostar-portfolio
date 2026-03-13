# Development Setup

## Prerequisites

- Node.js (with npm)
- Docker and Docker Compose

## Initial Setup

1. Start the database:
   ```bash
   docker-compose up -d
   ```

2. Copy environment files:
   ```bash
   cp .env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   cd ../import && npm install
   ```

4. Push the database schema:
   ```bash
   make db-push
   ```

5. (Optional) Load demo data:
   ```bash
   make db-demo-data
   ```

6. Start development servers:
   ```bash
   make dev
   ```

   This starts both backend (port 3000) and frontend (port 5173) concurrently.

## Project Structure

```
eurostar-portfolio-gsd/
├── backend/           # Fastify API server
│   ├── src/           # Source code
│   ├── drizzle/       # Database migrations
│   └── assets/        # Static assets
├── frontend/          # React/Vite application
│   ├── src/           # Source code
│   ├── e2e/           # Playwright E2E tests
│   └── public/        # Static files
├── import/            # Data import pipeline
│   ├── scripts/       # Import scripts
│   ├── source/        # Source Excel files
│   ├── staging/       # CSV staging files
│   └── mappings/      # Field mappings
├── docs/              # Documentation
└── docker-compose.yml # Database service
```

### Backend

- **Framework**: Fastify with TypeScript
- **Database**: PostgreSQL 16 with Drizzle ORM
- **Authentication**: EntraID (Azure AD) JWT validation

### Frontend

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Authentication**: MSAL (Microsoft Authentication Library)

### Import

- **Purpose**: Excel to database import pipeline
- **Steps**: Extract (Excel to CSV) -> Validate -> Load
