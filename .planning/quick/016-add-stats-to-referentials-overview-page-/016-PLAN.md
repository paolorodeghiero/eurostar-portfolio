---
phase: quick-016
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/routes/admin/referentials.ts
  - frontend/src/pages/admin/ReferentialList.tsx
autonomous: true

must_haves:
  truths:
    - "Each referential card displays item count (e.g., '3 Departments')"
    - "Stats load in single API call for efficiency"
    - "Counts match actual data in each referential table"
  artifacts:
    - path: "backend/src/routes/admin/referentials.ts"
      provides: "Overview stats endpoint with counts"
      exports: ["GET /stats"]
    - path: "frontend/src/pages/admin/ReferentialList.tsx"
      provides: "Card display with count badges"
      min_lines: 120
  key_links:
    - from: "frontend/src/pages/admin/ReferentialList.tsx"
      to: "/api/admin/stats"
      via: "fetch on mount"
      pattern: "fetch.*api/admin/stats"
---

<objective>
Add item count stats to referentials overview page cards for quick visibility into data volumes.

Purpose: Help admins quickly see how much data exists in each referential category without navigating to individual pages.
Output: Overview page displays counts like "3 Departments", "12 Teams" on each card.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md

Current implementation:
- 9 referential type cards with icon, name, description
- Each links to detail page at /admin/{type}
- No counts displayed

Existing patterns:
- Each admin route has GET / endpoint returning items with usageCount
- Pattern in departments.ts shows count aggregation using drizzle count()
- Admin routes already have referentials.ts as main router

Stack:
- Backend: Fastify, Drizzle ORM, PostgreSQL
- Frontend: React, TypeScript, React Router
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add stats endpoint to backend</name>
  <files>backend/src/routes/admin/referentials.ts</files>
  <action>
Add GET /stats endpoint to referentials router that returns counts for all 9 referential types in a single query batch.

Implementation:
- Add new route: fastify.get('/stats', async () => {...})
- Import count from drizzle-orm and all table schemas
- Use Promise.all to fetch counts in parallel from all 9 tables:
  - departments, teams, statuses, outcomes, costCenters
  - currencyRates, committeeLevels, committeeThresholds, costTshirtThresholds, competenceMonthPatterns
- Return object with counts keyed by table name:
  ```typescript
  {
    departments: 3,
    teams: 12,
    statuses: 5,
    outcomes: 4,
    costCenters: 8,
    currencyRates: 15,
    committeeLevels: 3,
    committeeThresholds: 3,
    costTshirtThresholds: 6,
    competenceMonthPatterns: 2
  }
  ```
- Use existing db.select({ count: count() }).from(table) pattern from departments.ts line 202-205

Place endpoint after existing GET / route (after line 36) and before register calls.
  </action>
  <verify>
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/admin/stats returns JSON with 10 count fields
  </verify>
  <done>Backend /api/admin/stats endpoint returns counts for all referential types</done>
</task>

<task type="auto">
  <name>Task 2: Display counts on overview cards</name>
  <files>frontend/src/pages/admin/ReferentialList.tsx</files>
  <action>
Fetch stats on mount and display item counts on each referential card.

Implementation:
1. Add state: `const [stats, setStats] = useState<Record<string, number>>({});`
2. Add useEffect to fetch on mount:
   ```typescript
   useEffect(() => {
     fetch('/api/admin/stats', {
       headers: { Authorization: `Bearer ${token}` }
     })
       .then(r => r.json())
       .then(setStats)
       .catch(console.error);
   }, []);
   ```
3. Add count display to each card below description (after line 94):
   ```tsx
   {stats[type.id] !== undefined && (
     <p className="text-xs text-gray-400 mt-2">
       {stats[type.id]} {stats[type.id] === 1 ? 'item' : 'items'}
     </p>
   )}
   ```

Use existing auth token from context/storage (pattern used elsewhere in codebase).
Map type.id to stats object keys (departments, teams, statuses, outcomes, cost-centers -> costCenters).
  </action>
  <verify>
1. npm run dev (frontend)
2. Navigate to http://localhost:5173/admin
3. Each card shows count like "3 items" below description
4. Counts match actual data in each referential page
  </verify>
  <done>Overview page displays accurate item counts on all 9 referential cards</done>
</task>

<task type="auto">
  <name>Task 3: Handle loading and error states</name>
  <files>frontend/src/pages/admin/ReferentialList.tsx</files>
  <action>
Add loading state and graceful error handling for stats fetch.

Implementation:
1. Add loading state: `const [loading, setLoading] = useState(true);`
2. Update fetch logic to set loading:
   ```typescript
   useEffect(() => {
     setLoading(true);
     fetch('/api/admin/stats', { headers: { Authorization: ... } })
       .then(r => r.json())
       .then(data => {
         setStats(data);
         setLoading(false);
       })
       .catch(err => {
         console.error('Failed to load stats:', err);
         setLoading(false);
       });
   }, []);
   ```
3. Show skeleton or empty state while loading:
   - If loading is true, show cards without count text
   - If stats failed to load, silently degrade (no count shown, card still functional)

No spinners needed - cards appear immediately, counts fade in when loaded.
  </action>
  <verify>
1. Check Network tab shows single /api/admin/stats call on mount
2. Counts appear after brief loading
3. If backend offline, cards still clickable (no crash)
  </verify>
  <done>Stats loading is graceful with no blocking UI or error crashes</done>
</task>

</tasks>

<verification>
- [ ] Backend /api/admin/stats returns all 10 referential counts
- [ ] Frontend fetches stats on mount with single API call
- [ ] Each card displays count badge like "3 items"
- [ ] Counts are accurate (match detail pages)
- [ ] Loading state handled gracefully
- [ ] Cards remain functional if stats fail to load
</verification>

<success_criteria>
- ReferentialList.tsx shows item counts on all 9 cards
- Single efficient API call (/api/admin/stats) on page load
- Counts match actual database values
- No loading spinners or blocking UI
- Cards remain clickable even if stats fail
</success_criteria>

<output>
After completion, create `.planning/quick/016-add-stats-to-referentials-overview-page-/016-SUMMARY.md`
</output>
