# Eurostar Portfolio - Development Commands
# Project root: /mnt/c/Users/paolo.Rodeghiero/Projects/eurostar-portfolio-gsd

.PHONY: help dev db-reset db-seed

# Default target - show available commands
help:
	@echo "Available commands:"
	@echo "  make dev       - Start both backend and frontend dev servers concurrently"
	@echo "  make db-reset  - Truncate all tables (empty database)"
	@echo "  make db-seed   - Seed the database with initial data"

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
