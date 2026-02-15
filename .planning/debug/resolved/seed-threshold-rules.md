---
status: resolved
trigger: "seed-threshold-rules"
created: 2026-02-09T00:00:00Z
updated: 2026-02-09T00:00:00Z
---

## Current Focus

hypothesis: Seed data is valid but validation gaps exist (no range overlap checks, no currency FK validation)
test: Identify what validations are missing from API
expecting: List of recommended validation improvements
next_action: Analyze range coverage and identify validation gaps

## Symptoms

expected: Committee thresholds should follow business rules enforced by API (e.g., valid currency codes, proper min/max ranges, correct level mappings)
actual: Direct database inserts may bypass validation that API enforces
errors: None reported yet - this is a preventative review
reproduction: Run seed script, then check if threshold data matches what API would allow
started: Review requested to ensure data integrity

## Eliminated

## Evidence

- timestamp: 2026-02-09T00:01:00Z
  checked: backend/src/db/seed.ts lines 190-201
  found: Seed inserts 6 committee threshold records directly (EUR and GBP with 3 levels each: not_necessary, optional, mandatory)
  implication: Direct database inserts bypass all API validation

- timestamp: 2026-02-09T00:02:00Z
  checked: backend/src/routes/admin/committee-thresholds.ts lines 24-72
  found: POST endpoint has 4 validation rules - minAmount>=0, maxAmount>minAmount, level in VALID_LEVELS, currency matches /^[A-Z]{3}$/
  implication: API enforces format and range validation that seed might not follow

- timestamp: 2026-02-09T00:03:00Z
  checked: backend/src/db/schema.ts lines 78-87
  found: Database schema allows nullable maxAmount, requires currency (3 chars) and level (20 chars), numeric fields precision 15 scale 2
  implication: Schema constraints are minimal - level could be any 20-char string, no FK to currency table

- timestamp: 2026-02-09T00:04:00Z
  checked: backend/src/lib/committee.ts lines 34-60
  found: Business logic queries thresholds by currency, expects level to be CommitteeLevel type ('mandatory' | 'optional' | 'not_necessary')
  implication: System depends on correct level values to determine committee requirements for projects

- timestamp: 2026-02-09T00:05:00Z
  checked: Seed data validation against API rules
  found: All seed threshold records comply with API validation rules
    - EUR/GBP minAmount values: all non-negative ✓
    - EUR/GBP maxAmount values: all greater than minAmount or null ✓
    - level values: all in VALID_LEVELS array ✓
    - currency values: all match /^[A-Z]{3}$/ pattern ✓
  implication: Seed data is currently valid, but validation gaps exist

- timestamp: 2026-02-09T00:06:00Z
  checked: Currency validation cross-system
  found: currencyRates API validates same pattern /^[A-Z]{3}$/, seed creates EUR/GBP rates for 2020-2026
  implication: No central currency referential - API accepts any 3-letter uppercase code

- timestamp: 2026-02-09T00:07:00Z
  checked: Threshold range coverage analysis
  found: EUR ranges [0-50000), [50000-200000), [200000-∞) - complete coverage with no gaps or overlaps ✓
        GBP ranges [0-42500), [42500-170000), [170000-∞) - complete coverage with no gaps or overlaps ✓
  implication: Seed data provides complete, non-overlapping coverage per currency

- timestamp: 2026-02-09T00:08:00Z
  checked: API validation for range conflicts
  found: API POST/PUT endpoints do NOT check for overlapping ranges between existing thresholds
  implication: User could create via API: EUR [0-100000, optional] and EUR [50000-150000, mandatory] causing conflicts

- timestamp: 2026-02-09T00:09:00Z
  checked: determineCommitteeLevel logic (committee.ts lines 37-60)
  found: Function iterates thresholds ordered by minAmount, uses totalBudget >= min && totalBudget < max
  implication: With boundary value 50000 EUR, condition "< max" means 50000 falls in [50000-200000) range ✓ Correct

## Resolution

root_cause: |
  Seed script inserts committee thresholds directly into database, bypassing API validation.
  Current seed data IS VALID and complies with all existing API validation rules.
  However, the API has significant validation gaps that could allow invalid data:

  1. No range overlap detection - API allows creating conflicting threshold ranges for same currency
  2. No currency referential validation - API accepts any 3-letter uppercase string, not verified against currencyRates
  3. No completeness validation - API doesn't ensure ranges cover all possible values (0 to infinity)
  4. No duplicate prevention - Multiple thresholds with identical ranges could be created

  The seed data itself is well-structured:
  - Complete range coverage (0 to ∞) for both EUR and GBP
  - No overlaps or gaps
  - Correct boundary handling (uses < max, so boundary values fall in higher range)
  - Valid level values ('mandatory', 'optional', 'not_necessary')
  - Valid currency codes matching currencyRates entries

recommendation: |
  SEED DATA: No changes needed - current seed data is correct

  API VALIDATION IMPROVEMENTS RECOMMENDED:

  1. Add range overlap validation to POST/PUT endpoints:
     - Before insert/update, check for existing thresholds in same currency with overlapping ranges
     - Reject if (newMin < existingMax) && (newMax > existingMin)

  2. Add currency referential validation:
     - Query currencyRates table to verify currency exists
     - Or create a VALID_CURRENCIES constant ['EUR', 'GBP'] based on business requirements

  3. Add range completeness validation (optional):
     - Warn if ranges don't cover 0 to infinity
     - Or enforce that one threshold must have maxAmount=null (covers to infinity)

  4. Add unique constraint validation:
     - Prevent duplicate ranges for same currency
     - Database unique constraint on (currency, minAmount, maxAmount) could be added

  5. Consider refactoring seed to use API:
     - PRO: Ensures seed data passes all validations
     - CON: More complex, slower seed, requires API server running
     - CURRENT ASSESSMENT: Not necessary since seed data is already compliant
     - FUTURE: If API validations are enhanced (especially overlap detection), seed would need updating anyway

  PRIORITY:
  - HIGH: Range overlap validation (prevents data integrity issues)
  - MEDIUM: Currency referential validation (prevents typos like 'EUR' vs 'EUE')
  - LOW: Completeness validation (nice-to-have, current seed already complete)
  - LOW: Refactor seed to use API (not needed if seed data remains manually curated)

verification: |
  Verified by code review:
  - Seed data compared against API validation rules: all compliant ✓
  - Range coverage analysis: complete, no gaps or overlaps ✓
  - Boundary value testing: 50000 EUR correctly falls in [50000-200000) range ✓
  - Currency codes verified: EUR and GBP both exist in currencyRates seed data ✓
  - Level values verified: all match VALID_LEVELS constant in API ✓

files_changed: []
