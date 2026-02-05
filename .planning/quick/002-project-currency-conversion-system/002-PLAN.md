---
phase: quick
plan: 002
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/db/schema.ts
  - backend/src/lib/currency-converter.ts
  - backend/src/routes/projects/project-budget.ts
  - backend/src/routes/projects/projects.ts
  - frontend/src/components/projects/tabs/BudgetTab.tsx
  - frontend/src/components/projects/tabs/GeneralTab.tsx
  - frontend/src/lib/project-api.ts
  - frontend/src/lib/project-budget-api.ts
autonomous: true

must_haves:
  truths:
    - "Project has a reportCurrency field (GBP or EUR) selectable in config/settings area"
    - "Allocations display in project reportCurrency with converted amounts"
    - "Project budget totals display in reportCurrency"
    - "Currency is shown in column headers (e.g., 'Allocated (EUR)')"
    - "Backend stores allocations in budget line source currency, converts dynamically"
    - "Backend stores project budget in EUR, converts dynamically for reporting"
  artifacts:
    - path: "backend/src/lib/currency-converter.ts"
      provides: "Currency conversion utility using currency_rates table"
    - path: "backend/src/db/schema.ts"
      contains: "reportCurrency"
    - path: "frontend/src/components/projects/tabs/BudgetTab.tsx"
      provides: "Currency labels in headers, converted amounts"
---

<objective>
Implement project-level currency selector for consistent reporting

Purpose: Budget and actuals can be in GBP or EUR, but allocations and totals should display in a single project-selected currency for consistency. Currently amounts mix currencies causing confusion.

Output:
- reportCurrency field on projects (GBP/EUR toggle)
- Backend currency conversion utility
- Frontend displays all amounts in reportCurrency with clear labels
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@backend/src/db/schema.ts
@backend/src/routes/projects/project-budget.ts
@frontend/src/components/projects/tabs/BudgetTab.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add reportCurrency field and backend conversion utility</name>
  <files>
    backend/src/db/schema.ts
    backend/src/lib/currency-converter.ts
    backend/src/routes/projects/project-budget.ts
    backend/src/routes/projects/projects.ts
  </files>
  <action>
1. In schema.ts, add to projects table:
   - `reportCurrency: varchar('report_currency', { length: 3 })` - defaults to null, accepts only 'GBP' or 'EUR'
   - Comment: "ISO 4217 currency code for reporting display (GBP or EUR)"

2. Create backend/src/lib/currency-converter.ts:
   - Export `convertCurrency(db, amount: string, fromCurrency: string, toCurrency: string, date?: Date): Promise<string>`
   - Query currency_rates table for valid rate at given date (or today)
   - If fromCurrency === toCurrency, return amount unchanged
   - If rate not found, throw error with clear message
   - Return converted amount as string with 2 decimal places
   - Export `getExchangeRate(db, fromCurrency: string, toCurrency: string, date?: Date): Promise<string | null>`

3. In project-budget.ts GET /:projectId/budget:
   - Add `reportCurrency` to project select
   - For each allocation, if reportCurrency is set and differs from allocation.currency:
     - Add `convertedAmount` field with converted value
   - Add `reportCurrency` to response
   - Return allocations with both original `allocationAmount` (in source currency) and `convertedAmount` (in reportCurrency)
   - Calculate `totalAllocated` in reportCurrency (sum of converted amounts)

4. In project-budget.ts PUT /:projectId/budget:
   - Accept `reportCurrency` in body (optional)
   - Validate it's 'GBP' or 'EUR' or null
   - Save to database

5. In projects.ts GET /:id:
   - Include `reportCurrency` in project response
  </action>
  <verify>
    npm run build in backend directory succeeds
    Check schema changes with: grep -n "reportCurrency" backend/src/db/schema.ts
    Check converter exists: ls backend/src/lib/currency-converter.ts
  </verify>
  <done>
    - projects table has reportCurrency field
    - currency-converter.ts utility exists and exports convertCurrency function
    - GET /api/projects/:id/budget returns reportCurrency and converted allocation amounts
    - PUT /api/projects/:id/budget accepts reportCurrency
  </done>
</task>

<task type="auto">
  <name>Task 2: Frontend currency selector and display updates</name>
  <files>
    frontend/src/components/projects/tabs/BudgetTab.tsx
    frontend/src/components/projects/tabs/GeneralTab.tsx
    frontend/src/lib/project-api.ts
    frontend/src/lib/project-budget-api.ts
  </files>
  <action>
1. In project-api.ts:
   - Add `reportCurrency` to Project type

2. In project-budget-api.ts:
   - Add `reportCurrency` to ProjectBudget type
   - Add `convertedAmount?: string` to allocation type
   - Update updateProjectBudget to accept reportCurrency parameter

3. In BudgetTab.tsx:
   - Replace the generic Currency selector (EUR/GBP/USD/CHF) with a simpler "Report Currency" toggle/switch:
     - Only GBP and EUR options
     - Use a two-button toggle or simple Select with just these two options
     - Label: "Report Currency" with helper text "All amounts will be displayed in this currency"
   - Move budgetCurrency (input currency for OPEX/CAPEX) to remain but clarify it's "Budget Input Currency"
   - Update column headers to show currency: "Allocated ({reportCurrency})", "Available ({reportCurrency})"
   - Display `convertedAmount` if present, otherwise `allocationAmount`
   - Show original amount in tooltip or small text if converted (e.g., "12,000.00 EUR (from 10,000.00 GBP)")
   - Update total allocated display to use reportCurrency
   - Format all amounts with Intl.NumberFormat using reportCurrency code

4. Update allocation match alert to compare in reportCurrency

5. Ensure currency labels are visible in:
   - OPEX Budget label: "OPEX Budget ({budgetCurrency})"
   - CAPEX Budget label: "CAPEX Budget ({budgetCurrency})"
   - Total Budget: show in reportCurrency with conversion note
   - Allocations table headers
  </action>
  <verify>
    npm run build in frontend directory succeeds
    Visual check: open project sidebar, Budget tab shows currency labels in headers
    Visual check: reportCurrency toggle between GBP/EUR works
  </verify>
  <done>
    - BudgetTab shows Report Currency selector (GBP/EUR toggle)
    - Column headers show currency code: "Allocated (EUR)"
    - Amounts display in reportCurrency with conversion
    - Total allocated calculated in reportCurrency
    - Labels clearly indicate currency throughout
  </done>
</task>

<task type="auto">
  <name>Task 3: Database migration and seed data</name>
  <files>
    backend/drizzle/migrations (new migration file)
    backend/src/db/seed.ts
  </files>
  <action>
1. Generate and apply migration:
   - Run `npx drizzle-kit generate` to create migration for reportCurrency column
   - The migration should add `report_currency VARCHAR(3)` column to projects table

2. Update seed.ts if it creates test projects:
   - Add reportCurrency: 'EUR' to sample projects

3. Ensure currency_rates table has EUR/GBP and GBP/EUR rates:
   - Check seed.ts for existing rates
   - If not present, add:
     - EUR to GBP rate (e.g., 0.85)
     - GBP to EUR rate (e.g., 1.18)
     - With validFrom: '2024-01-01' and no validTo (current rate)

4. Document the schema change in migration file comment
  </action>
  <verify>
    Migration file exists in backend/drizzle/migrations
    Run `cd backend && npx drizzle-kit push` (if Docker/Postgres available)
    Check seed has currency rates: grep -n "currencyRates" backend/src/db/seed.ts
  </verify>
  <done>
    - Migration file created for reportCurrency column
    - Seed data includes EUR/GBP exchange rates
    - Schema can be pushed to database
  </done>
</task>

</tasks>

<verification>
1. Backend builds without errors: `cd backend && npm run build`
2. Frontend builds without errors: `cd frontend && npm run build`
3. Schema includes reportCurrency field
4. Currency converter utility exists and handles edge cases
5. BudgetTab displays currency in all relevant labels and headers
</verification>

<success_criteria>
- Project has reportCurrency field (GBP or EUR)
- Budget tab shows clear "Report Currency" selector
- All allocation amounts display in reportCurrency with conversion
- Column headers include currency code (e.g., "Allocated (EUR)")
- Total budget and total allocated shown in reportCurrency
- Original currency amounts preserved in database
- Currency conversion uses rates from currency_rates table
</success_criteria>

<output>
After completion, create `.planning/quick/002-project-currency-conversion-system/002-SUMMARY.md`
</output>
