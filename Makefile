# Eurostar Portfolio - Development Commands
# Project root: /mnt/c/Users/paolo.Rodeghiero/Projects/eurostar-portfolio-gsd

.PHONY: help dev db-reset db-demo-data db-push db-fresh

# Default target - show available commands
help:
	@echo "Available commands:"
	@echo "  make dev          - Start both backend and frontend dev servers concurrently"
	@echo "  make db-push      - Push schema changes to database (drizzle-kit push)"
	@echo "  make db-reset     - Truncate all tables (empty database)"
	@echo "  make db-demo-data - Load demo data (departments, projects, etc.)"
	@echo "  make db-fresh     - Full reset: push schema + truncate + demo data"

# Start both backend and frontend dev servers concurrently with labeled output
dev:
	@npx concurrently --kill-others \
		--names "BE,FE" \
		--prefix-colors "blue,green" \
		"cd backend && npm run dev" \
		"cd frontend && npm run dev"

# Truncate all tables (empty database)
db-reset:
	cd backend && npm run db:reset

# Load demo data (departments, projects, etc.)
db-demo-data:
	@echo "Loading demo data..."
	cd backend && npm run db:demo-data

# Push schema changes to database (drizzle-kit push)
db-push:
	@echo "Pushing schema to database..."
	cd backend && npx drizzle-kit push

# Full reset: push schema + truncate + demo data
db-fresh:
	@echo "Full database reset..."
	cd backend && npx drizzle-kit push && npm run db:reset && npm run db:demo-data
	@echo "Database ready with fresh data."
