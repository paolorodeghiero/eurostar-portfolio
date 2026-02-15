---
phase: quick
plan: 014
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/db/schema.ts
  - backend/src/db/seed.ts
  - backend/src/routes/admin/committee-thresholds.ts
  - backend/src/lib/committee.ts
  - frontend/src/pages/admin/CommitteeThresholdsPage.tsx
autonomous: true

must_haves:
  truths:
    - "Committee thresholds use EUR only (no GBP or other currencies)"
    - "Committee thresholds use maxAmount limits pattern (not min/max ranges)"
    - "Admin can create/edit committee thresholds with level and maxAmount"
    - "Committee level determination works with new limit-based structure"
  artifacts:
    - path: "backend/src/db/schema.ts"
      provides: "Refactored committeeThresholds table with level and maxAmount only"
      contains: "committeeThresholds"
    - path: "backend/src/routes/admin/committee-thresholds.ts"
      provides: "Updated CRUD endpoints for limit-based thresholds"
      exports: "committeeThresholdsRoutes"
    - path: "frontend/src/pages/admin/CommitteeThresholdsPage.tsx"
      provides: "Admin UI for limit-based thresholds without currency selector"
  key_links:
    - from: "backend/src/lib/committee.ts"
      to: "backend/src/db/schema.ts"
      via: "determineCommitteeLevel query"
      pattern: "committeeThresholds"
---

<objective>
Refactor committee thresholds from min/max ranges with multiple currencies to a simple limits structure (level + maxAmount) with EUR only, matching the cost t-shirt thresholds pattern.

Purpose: Simplify committee threshold management since project budgets are stored in EUR
Output: Updated schema, backend routes, seed data, and frontend UI
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@backend/src/db/schema.ts
@backend/src/routes/admin/committee-thresholds.ts
@backend/src/routes/admin/cost-tshirt-thresholds.ts (reference pattern)
@backend/src/lib/committee.ts
@frontend/src/pages/admin/CommitteeThresholdsPage.tsx
@frontend/src/pages/admin/CostTshirtThresholdsPage.tsx (reference pattern)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Refactor backend schema and routes for limit-based thresholds</name>
  <files>
    backend/src/db/schema.ts
    backend/src/db/seed.ts
    backend/src/routes/admin/committee-thresholds.ts
    backend/src/lib/committee.ts
  </files>
  <action>
1. **Update schema.ts** - Modify committeeThresholds table:
   - Remove `minAmount` column
   - Remove `currency` column (EUR-only, implied)
   - Keep `level` (mandatory, optional, not_necessary)
   - Keep `maxAmount` (upper limit for this level)
   - Result: `id, level, maxAmount, createdAt, updatedAt`

2. **Update seed.ts** - Change seed data to limit structure:
   ```typescript
   // EUR thresholds (limits-based: amount <= maxAmount gets this level)
   // Sorted by maxAmount ascending: not_necessary, optional, mandatory
   { level: 'not_necessary', maxAmount: '50000' },   // 0 - 50K
   { level: 'optional', maxAmount: '200000' },       // 50K - 200K
   { level: 'mandatory', maxAmount: null },          // 200K+ (unlimited)
   ```
   Remove GBP thresholds entirely.

3. **Update committee-thresholds.ts** routes:
   - POST/PUT accept: `{ level, maxAmount }` (no currency, no minAmount)
   - Validate level is one of: mandatory, optional, not_necessary
   - Validate maxAmount is non-negative number (or null for unlimited)
   - Remove all currency validation

4. **Update committee.ts** - Rewrite determineCommitteeLevel:
   - Remove currency parameter (always EUR)
   - Query thresholds ordered by maxAmount ascending (nulls last)
   - Find first threshold where totalBudget <= maxAmount (or maxAmount is null)
   - Return that level

   New signature: `determineCommitteeLevel(db, totalBudget: number): Promise<CommitteeLevel>`

5. **Create database migration** (drizzle migration):
   ```sql
   ALTER TABLE committee_thresholds DROP COLUMN min_amount;
   ALTER TABLE committee_thresholds DROP COLUMN currency;
   DELETE FROM committee_thresholds; -- Clear old data, seed will repopulate
   ```
  </action>
  <verify>
    - `npm run build` in backend passes
    - Schema compiles without TypeScript errors
    - Seed data structure matches new schema
  </verify>
  <done>
    - committeeThresholds schema has only: id, level, maxAmount, createdAt, updatedAt
    - Backend routes accept/return limit-based structure without currency
    - determineCommitteeLevel works without currency parameter
  </done>
</task>

<task type="auto">
  <name>Task 2: Refactor frontend admin page for limit-based thresholds</name>
  <files>
    frontend/src/pages/admin/CommitteeThresholdsPage.tsx
  </files>
  <action>
1. **Update CommitteeThreshold interface**:
   ```typescript
   interface CommitteeThreshold {
     id: number;
     level: string;       // mandatory, optional, not_necessary
     maxAmount: number | null;  // null = unlimited
     usageCount: number;
     createdAt: string;
   }
   ```
   Remove minAmount, currency.

2. **Remove CURRENCIES constant** - No longer needed.

3. **Update form state**:
   - Remove `formMinAmount`, `formCurrency`
   - Keep `formMaxAmount` (allow empty for unlimited)
   - Keep `formLevel`

4. **Update columns definition**:
   - Remove "Amount Range" column
   - Add "Max Amount" column showing formatted amount or "Unlimited"
   - Remove "Currency" column
   - Keep "Committee Level" and "Usage" columns

5. **Update form dialog**:
   - Remove Min Amount input
   - Remove Currency selector
   - Keep Level dropdown
   - Keep Max Amount input with "Unlimited" placeholder for null
   - Add helper text: "Projects with budget up to this amount get this level"

6. **Update payload construction**:
   - `{ level: formLevel, maxAmount: formMaxAmount === '' ? null : formMaxAmount }`

7. **Update formatAmount** helper:
   - Always use EUR for display: `new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })`
  </action>
  <verify>
    - `npm run build` in frontend passes
    - No TypeScript errors in CommitteeThresholdsPage
  </verify>
  <done>
    - Admin page shows level + maxAmount columns
    - Form has level dropdown and maxAmount input only
    - No currency selector visible
    - Amounts display in EUR format
  </done>
</task>

<task type="auto">
  <name>Task 3: Update callers of determineCommitteeLevel and verify end-to-end</name>
  <files>
    backend/src/routes/projects/project-committee.ts
    backend/src/routes/projects/index.ts
  </files>
  <action>
1. **Find all callers of determineCommitteeLevel**:
   ```bash
   grep -r "determineCommitteeLevel" backend/src/
   ```

2. **Update each caller** to remove currency parameter:
   - Old: `determineCommitteeLevel(db, totalBudget, currency)`
   - New: `determineCommitteeLevel(db, totalBudget)`

   Since project budgets are stored in EUR (per STATE.md decision: "All monetary values stored in EUR"), this simplification is correct.

3. **Run database migration**:
   - Generate migration with drizzle-kit
   - Apply migration to update schema

4. **Test the API endpoints**:
   - GET /api/admin/committee-thresholds returns limit-based structure
   - POST creates threshold with level + maxAmount
   - PUT updates threshold
   - DELETE removes threshold

5. **Verify committee level determination** still works for projects.
  </action>
  <verify>
    - `npm run build` passes for both frontend and backend
    - Backend starts without errors
    - API endpoints work: `curl http://localhost:3001/api/admin/committee-thresholds`
    - Project budget changes still auto-calculate committee level
  </verify>
  <done>
    - All determineCommitteeLevel calls updated to new signature
    - Database migration applied
    - Committee threshold CRUD works end-to-end
    - Committee level auto-calculation works for projects
  </done>
</task>

</tasks>

<verification>
- [ ] Database schema has refactored committeeThresholds table (no minAmount, no currency)
- [ ] Seed data uses limit-based structure with EUR values
- [ ] Backend routes work without currency parameter
- [ ] Frontend admin page shows level + maxAmount only
- [ ] determineCommitteeLevel works with new structure
- [ ] Both frontend and backend build successfully
</verification>

<success_criteria>
- Committee thresholds are EUR-only with limits structure (level + maxAmount)
- Admin can manage thresholds without selecting currency
- Project committee level determination works correctly
- Pattern matches cost t-shirt thresholds for consistency
</success_criteria>

<output>
After completion, create `.planning/quick/014-refactor-committee-threshold-to-euro-onl/014-SUMMARY.md`
</output>
