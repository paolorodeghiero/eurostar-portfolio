# Eurostar Portfolio - Development Commands
# Project root: /mnt/c/Users/paolo.Rodeghiero/Projects/eurostar-portfolio-gsd

.PHONY: help dev db-reset db-seed

# Default target - show available commands
help:
	@echo "Available commands:"
	@echo "  make dev       - Start both backend and frontend dev servers concurrently"
	@echo "  make db-reset  - Full database reset with schema push, audit trigger, and seed"
	@echo "  make db-seed   - Seed the database with initial data"

# Start both backend and frontend dev servers concurrently
dev:
	@echo "Starting backend and frontend dev servers..."
	@trap 'kill 0' EXIT; \
	cd backend && npm run dev & \
	cd frontend && npm run dev

# Full database reset: push schema with force, apply audit trigger, then seed
db-reset:
	@echo "Resetting database schema..."
	cd backend && npx drizzle-kit push --force
	@echo "Applying audit trigger..."
	cd backend && npx tsx -e "import { db } from './src/db/index.js'; import { sql } from 'drizzle-orm'; import { readFileSync } from 'fs'; const trigger = readFileSync('./drizzle/0008_audit_trigger.sql', 'utf8'); await db.execute(sql.raw(trigger)); console.log('Audit trigger applied'); process.exit(0);"
	@echo "Seeding database..."
	cd backend && npm run db:seed
	@echo "Database reset complete!"

# Seed the database with initial data
db-seed:
	@echo "Seeding database..."
	cd backend && npm run db:seed
