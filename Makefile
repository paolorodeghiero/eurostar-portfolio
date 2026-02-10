# Eurostar Portfolio - Development Commands
# Project root: /mnt/c/Users/paolo.Rodeghiero/Projects/eurostar-portfolio-gsd

.PHONY: help dev db-reset db-seed db-push db-fresh

# Default target - show available commands
help:
	@echo "Available commands:"
	@echo "  make dev       - Start both backend and frontend dev servers concurrently"
	@echo "  make db-push   - Push schema changes to database (drizzle-kit push)"
	@echo "  make db-reset  - Truncate all tables (empty database)"
	@echo "  make db-seed   - Seed the database with initial data"
	@echo "  make db-fresh  - Full reset: push schema + truncate + seed"

# Start both backend and frontend dev servers concurrently
dev:
	@echo "Starting backend and frontend dev servers..."
	@trap 'kill 0' EXIT; \
	cd backend && npm run dev & \
	cd frontend && npm run dev

# Truncate all tables (empty database)
db-reset:
	cd backend && npm run db:reset

# Seed the database with initial data
db-seed:
	@echo "Seeding database..."
	cd backend && npm run db:seed

# Push schema changes to database (drizzle-kit push)
db-push:
	@echo "Pushing schema to database..."
	cd backend && npx drizzle-kit push

# Full reset: push schema + truncate + seed
db-fresh:
	@echo "Full database reset..."
	cd backend && npx drizzle-kit push && npm run db:reset && npm run db:seed
	@echo "Database ready with fresh data."
