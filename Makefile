# Eurostar Portfolio - Development Commands
# Project root: /mnt/c/Users/paolo.Rodeghiero/Projects/eurostar-portfolio-gsd

.PHONY: help dev db-reset db-demo-data db-push import-extract import-validate import-load import-all import-dry-run import-help test test-frontend test-backend test-coverage test-watch e2e e2e-headed

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
	@echo ""
	@echo "Testing:"
	@echo "  make test             - Run all tests (frontend + backend)"
	@echo "  make test-frontend    - Run frontend tests"
	@echo "  make test-backend     - Run backend tests"
	@echo "  make test-coverage    - Generate coverage reports for both packages"
	@echo "  make test-watch       - Instructions for running tests in watch mode"
	@echo "  make e2e              - Run E2E tests (requires backend running with DEV_MODE=true)"
	@echo "  make e2e-headed       - Run E2E tests with visible browser"

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
	cd import && npm run extract

import-validate: ## Validate staging CSV files (schema + cross-CSV consistency)
	cd import && npm run validate

import-load: ## Load validated data to database
	cd import && npm run load

import-all: ## Run full import pipeline (extract -> validate -> load)
	cd import && npm run all

import-dry-run: ## Preview full import without database changes
	cd import && npm run dry-run

import-help: ## Show import tool help
	cd import && npm run import -- --help

# Testing
test: test-frontend test-backend
	@echo "All tests passed"

test-frontend:
	cd frontend && npm run test:run

test-backend:
	cd backend && npm run test:run

test-coverage:
	cd frontend && npm run test:coverage
	cd backend && npm run test:coverage

test-watch:
	@echo "Run 'npm test' in frontend/ or backend/ for watch mode"

# E2E Testing
# Note: Requires backend running with DEV_MODE=true
# Start backend: cd backend && DEV_MODE=true npm run dev
e2e:
	cd frontend && npm run e2e

e2e-headed:
	cd frontend && npm run e2e:headed
