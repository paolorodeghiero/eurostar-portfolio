# Environment Configuration

## Environment Files

| File | Purpose |
|------|---------|
| `.env.example` | Backend environment template |
| `frontend/.env.example` | Frontend environment template |
| `backend/.env` | Backend configuration (copy from `.env.example`) |
| `frontend/.env` | Frontend configuration (copy from `frontend/.env.example`) |

## Backend Environment Variables

Location: `backend/.env` (copy from root `.env.example`)

### Server

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `3000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

### Database

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/eurostar_portfolio` |

### Development

| Variable | Description | Default |
|----------|-------------|---------|
| `DEV_MODE` | Enable development mode (bypasses auth) | `true` |

### EntraID Authentication

| Variable | Description |
|----------|-------------|
| `ENTRA_TENANT_ID` | Azure AD tenant ID |
| `ENTRA_CLIENT_ID` | API application client ID |
| `ADMIN_GROUP_ID` | Azure AD group ID for admin users |

## Frontend Environment Variables

Location: `frontend/.env` (copy from `frontend/.env.example`)

| Variable | Description |
|----------|-------------|
| `VITE_ENTRA_TENANT_ID` | Azure AD tenant ID |
| `VITE_ENTRA_CLIENT_ID` | Frontend application client ID |
| `VITE_API_SCOPE` | API scope for token acquisition (e.g., `api://<api-client-id>/.default`) |
| `VITE_API_URL` | Backend API URL (default: `http://localhost:3000`) |

## Docker Services

Defined in `docker-compose.yml`:

### PostgreSQL

| Property | Value |
|----------|-------|
| Image | `postgres:16` |
| Container name | `eurostar-portfolio-db` |
| Port | `5432:5432` |
| Database | `eurostar_portfolio` |
| Username | `postgres` |
| Password | `postgres` |
| Volume | `postgres_data` (persistent) |

### Docker Commands

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# Stop and remove data
docker-compose down -v

# View logs
docker-compose logs -f postgres
```

## Port Configuration

| Service | Port | Description |
|---------|------|-------------|
| Backend | 3000 | Fastify API server |
| Frontend | 5173 | Vite dev server |
| PostgreSQL | 5432 | Database |
