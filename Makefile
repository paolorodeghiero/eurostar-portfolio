# Eurostar Portfolio - Development Commands
# Project root: /mnt/c/Users/paolo.Rodeghiero/Projects/eurostar-portfolio-gsd

.PHONY: help dev db-reset db-demo-data db-push import-extract import-validate import-load import-all import-dry-run import-help

# Default target - show available commands
help:
	@echo "Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start both backend and frontend dev servers concurrently"
	@echo ""
	@echo "Database:"
	@echo "  make db-push      - Push schema changes to database (drizzle-kit push)"
	@echo "  make db-reset     - Truncate all tables and seed essential data"
	@echo "  make db-demo-data - Load demo data (departments, projects, etc.)"
	@echo ""
	@echo "Data Import:"
	@echo "  make import-extract   - Extract data from Excel to CSV staging files"
	@echo "  make import-validate  - Validate staging CSV files (schema + cross-CSV consistency)"
	@echo "  make import-load      - Load validated data to database"
	@echo "  make import-all       - Run full import pipeline (extract -> validate -> load)"
	@echo "  make import-dry-run   - Preview full import without database changes"
	@echo "  make import-help      - Show import tool help"

# Start both backend and frontend dev servers concurrently with labeled output
dev:
	@npx concurrently --kill-others \
		--names "BE,FE" \
		--prefix-colors "blue,green" \
		"cd backend && npm run dev" \
		"cd frontend && npm run dev"

# Truncate all tables and seed essential data
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

# Data Import
import-extract: ## Extract data from Excel to CSV staging files
	cd backend && npm run import:extract

import-validate: ## Validate staging CSV files (schema + cross-CSV consistency)
	cd backend && npm run import:validate

import-load: ## Load validated data to database
	cd backend && npm run import:load

import-all: ## Run full import pipeline (extract -> validate -> load)
	cd backend && npm run import:all

import-dry-run: ## Preview full import without database changes
	cd backend && npm run import:dry-run

import-help: ## Show import tool help
	cd backend && npm run import -- --help
