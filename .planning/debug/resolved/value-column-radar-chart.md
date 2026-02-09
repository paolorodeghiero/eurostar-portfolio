---
status: resolved
trigger: "value-column-radar-chart"
created: 2026-02-09T00:00:00Z
updated: 2026-02-09T00:40:00Z
---

## Current Focus

hypothesis: CONFIRMED - Backend GET /api/projects omits values array from response
test: Apply fix to include values with outcome names in portfolio list endpoint
expecting: Values array with outcomeId, outcomeName, score will be returned and radar charts will display
next_action: Modify backend/src/routes/projects/projects.ts to join outcomes table and include values array

## Symptoms

expected: Value column should show a mini radar chart (40x40px) visualizing project value scores across multiple dimensions
actual: Column shows only "-" dash character
errors: No console errors reported
reproduction: Load portfolio page, look at Value column in table
started: Never worked - radar chart has never displayed correctly since implementation

## Eliminated

## Evidence

- timestamp: 2026-02-09T00:05:00Z
  checked: ValueScoreCell component implementation
  found: Component shows "-" when values prop is undefined or empty array (line 14-16)
  implication: Component is working correctly, issue is missing data

- timestamp: 2026-02-09T00:10:00Z
  checked: portfolioColumns.tsx line 164
  found: Column accesses 'values' property from PortfolioProject
  implication: Column definition expects values array with outcomeName and score

- timestamp: 2026-02-09T00:15:00Z
  checked: Backend API GET /api/projects (lines 86-264)
  found: API fetches projectValues (lines 151-158) but only uses them to calculate valueScoreAvg (lines 195-197). The values array with outcome names is NEVER returned in the response (lines 247-264)
  implication: Root cause identified - backend omits values array from portfolio list response

- timestamp: 2026-02-09T00:17:00Z
  checked: ProjectValue interface in frontend/src/lib/project-api.ts
  found: ProjectValue interface includes outcomeId, outcomeName, score, justification (lines 38-43)
  implication: Frontend expects outcomeName to be included in values array for radar chart labels

- timestamp: 2026-02-09T00:30:00Z
  checked: Backend API response after fix
  found: API now returns values array: [{"outcomeId":79,"outcomeName":"Punctuality","score":4},{"outcomeId":80,"outcomeName":"People Engagement","score":4},...]
  implication: Fix successful - backend now provides all data needed for radar chart

- timestamp: 2026-02-09T00:35:00Z
  checked: ValueScoreCell component logic
  found: Component receives values prop, maps over values to create data array with dimension (outcomeName truncated to 3 chars) and value (score), renders Recharts RadarChart
  implication: With values array now populated, radar charts should display in Value column

## Resolution

root_cause: Backend GET /api/projects endpoint fetches projectValues scores (lines 151-158) but only uses them to calculate valueScoreAvg. The endpoint does not join with outcomes table to get outcome names, and does not include the values array in the response object (lines 247-264). ValueScoreCell requires values array with outcomeName property for radar chart dimension labels.
fix: Modified backend/src/routes/projects/projects.ts to: 1) Join outcomes table in allValues query to get outcomeName (line 160), 2) Change valuesByProject grouping to store full value objects instead of just scores (lines 181-186), 3) Calculate valueScoreAvg from filtered scores (lines 196-200), 4) Add values array to response object with outcomeId, outcomeName, and score properties (lines 264-268)
verification: Verified API returns values array with correct structure. Frontend ValueScoreCell component will now receive populated values prop and render radar charts. The fix addresses the root cause by providing the missing data (outcome names) required for radar chart labels.
files_changed: ['backend/src/routes/projects/projects.ts']
