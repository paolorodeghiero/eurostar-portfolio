# Phase 10: Add test suite including frontend non-regression tests - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement a comprehensive test suite covering backend API tests and frontend non-regression tests for the Eurostar Portfolio application. The focus is on establishing test infrastructure, writing tests across all layers, and integrating with CI/CD.

</domain>

<decisions>
## Implementation Decisions

### Coverage Strategy
- Full stack testing: backend API tests + frontend component/integration tests
- Frontend layers: balanced mix — unit tests for utilities, component tests for UI, E2E for critical user paths
- Backend approach: integration tests against real test database, unit tests with mocks for business logic, contract tests for API schemas
- Coverage target: track metrics, aim for 80%+ without hard enforcement — report coverage to encourage improvement

### Non-regression Approach
- Type: Visual snapshots for all pages + behavior tests for user interactions
- Visual scope: all pages/routes get visual snapshot tests
- Snapshot updates: auto-update in CI on approved PRs (no manual review workflow)
- Test data: database fixtures for E2E tests, mocked API responses for component tests — both approaches as appropriate

### Claude's Discretion
- Test framework choices (Vitest, Playwright, Jest, etc.)
- File organization and naming conventions
- Specific CI configuration details
- Which utilities get unit tests vs integration coverage

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for TypeScript/React testing.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-add-test-suite-including-frontend-non-regression-tests*
*Context gathered: 2026-02-18*
