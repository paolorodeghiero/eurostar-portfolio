# Add committee threshold API validation

**Created:** 2026-02-09T14:00
**Area:** api
**Priority:** high
**Phase:** 6

## Context

Found during seed script review. The seed data is valid, but the API lacks validation that could allow invalid threshold configurations through the admin interface.

See: `.planning/debug/resolved/seed-threshold-rules.md`

## Tasks

### HIGH Priority
- [ ] Add range overlap detection to POST/PUT endpoints
  - Check for overlapping ranges within same currency before insert/update
  - Return 400 with clear error message if overlap detected

### MEDIUM Priority
- [ ] Add currency referential validation
  - Only allow 'EUR' and 'GBP' (business requirement)
  - Or validate against currencyRates table

### LOW Priority
- [ ] Add range completeness validation
  - Ensure ranges cover 0 to infinity with no gaps
- [ ] Add duplicate prevention
  - Prevent identical ranges from being created

## Files to Modify

- `backend/src/routes/admin/committee-thresholds.ts`

## Acceptance Criteria

- [ ] API rejects threshold ranges that overlap with existing ranges
- [ ] API rejects currencies not in approved list (EUR, GBP)
- [ ] Admin UI shows validation errors clearly
