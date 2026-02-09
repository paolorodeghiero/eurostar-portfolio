---
phase: quick-008
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/portfolio/columns/ValueScoreCell.tsx
  - frontend/src/components/portfolio/columns/portfolioColumns.tsx
  - frontend/src/pages/portfolio/PortfolioPage.tsx
  - frontend/src/components/projects/ProjectSidebar.tsx
  - frontend/src/components/projects/ProjectTabs.tsx
autonomous: true

must_haves:
  truths:
    - "Hovering over the value radar chart shows outcome names and scores"
    - "Clicking the value radar chart opens the sidebar to the Value tab"
  artifacts:
    - path: "frontend/src/components/portfolio/columns/ValueScoreCell.tsx"
      provides: "Mini radar with Tooltip and onClick"
    - path: "frontend/src/components/projects/ProjectSidebar.tsx"
      provides: "defaultTab prop support"
    - path: "frontend/src/components/projects/ProjectTabs.tsx"
      provides: "Controlled tab selection via prop"
  key_links:
    - from: "ValueScoreCell"
      to: "PortfolioPage handleValueClick"
      via: "onClick callback from column meta"
      pattern: "onValueClick"
    - from: "PortfolioPage"
      to: "ProjectSidebar"
      via: "defaultTab prop"
      pattern: "defaultTab.*value"
---

<objective>
Add hover tooltips showing outcome names/scores on the value radar chart in the portfolio table,
and make clicking the chart open the project sidebar directly to the Value tab.

Purpose: Improve data discoverability - users can quickly see value breakdown on hover and jump to edit with one click.
Output: Enhanced ValueScoreCell with Tooltip, sidebar opens to Value tab on click.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@frontend/src/components/portfolio/columns/ValueScoreCell.tsx
@frontend/src/components/portfolio/columns/portfolioColumns.tsx
@frontend/src/pages/portfolio/PortfolioPage.tsx
@frontend/src/components/projects/ProjectSidebar.tsx
@frontend/src/components/projects/ProjectTabs.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Tooltip and click handler to ValueScoreCell</name>
  <files>frontend/src/components/portfolio/columns/ValueScoreCell.tsx</files>
  <action>
    1. Import Tooltip from recharts alongside existing imports
    2. Add onClick prop to ValueScoreCellProps interface: `onClick?: () => void`
    3. Wrap the chart container div with click handling:
       - Add onClick that calls the prop and e.stopPropagation() to prevent row click
       - Add cursor-pointer class
       - Add role="button" and keyboard handler for accessibility
    4. Add Recharts Tooltip component to RadarChart:
       - Use formatter to display "{outcomeName}: {score}/5"
       - Style to match app theme (bg-popover, border, shadow)
       - Use contentStyle and labelStyle for theming
    5. Keep React.memo wrapper for performance
  </action>
  <verify>
    TypeScript compiles without errors: `cd frontend && npx tsc --noEmit`
  </verify>
  <done>
    ValueScoreCell accepts onClick prop and shows Tooltip on hover with outcome names and scores.
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire up click callback through column and page</name>
  <files>
    frontend/src/components/portfolio/columns/portfolioColumns.tsx
    frontend/src/pages/portfolio/PortfolioPage.tsx
    frontend/src/components/projects/ProjectSidebar.tsx
    frontend/src/components/projects/ProjectTabs.tsx
  </files>
  <action>
    **portfolioColumns.tsx:**
    1. Update the valueScore column cell to pass an onClick handler
    2. Use row.original.id to identify which project was clicked
    3. Access a callback via table.options.meta (standard TanStack Table pattern)
    4. Pattern: `onClick={() => table.options.meta?.onValueClick?.(row.original.id)}`

    **PortfolioPage.tsx:**
    1. Add `defaultTab` state: `const [defaultTab, setDefaultTab] = useState<string>('general')`
    2. Create handleValueClick callback that:
       - Sets selectedProjectId to the clicked project
       - Sets defaultTab to 'value'
       - Opens the sidebar
    3. Pass meta to useReactTable: `meta: { onValueClick: handleValueClick }`
    4. Pass defaultTab prop to ProjectSidebar
    5. Reset defaultTab to 'general' when sidebar closes or when row is clicked normally

    **ProjectSidebar.tsx:**
    1. Add defaultTab prop: `defaultTab?: string`
    2. Pass defaultTab to ProjectTabs component

    **ProjectTabs.tsx:**
    1. Add defaultTab prop: `defaultTab?: string`
    2. Use controlled Tabs with value/onValueChange instead of defaultValue
    3. Initialize activeTab state from defaultTab prop
    4. Update activeTab when defaultTab prop changes (useEffect)
  </action>
  <verify>
    1. `cd frontend && npx tsc --noEmit` passes
    2. `cd frontend && npm run dev` starts without errors
    3. Manual test: Hover over radar shows tooltip, click opens sidebar to Value tab
  </verify>
  <done>
    Clicking value radar in table opens sidebar directly to Value tab. Normal row click still opens to General tab.
  </done>
</task>

</tasks>

<verification>
1. TypeScript compiles: `cd frontend && npx tsc --noEmit`
2. Dev server runs: `cd frontend && npm run dev`
3. Functional verification:
   - Hover over a value radar chart in the portfolio table
   - Tooltip appears showing outcome names and their scores (e.g., "Revenue: 4/5")
   - Click on the radar chart
   - Sidebar opens with Value tab selected (not General)
   - Click on a different part of the row (not the radar)
   - Sidebar opens with General tab selected
</verification>

<success_criteria>
- Value radar shows hover tooltip with outcome names and scores
- Clicking value radar opens sidebar to Value tab specifically
- Normal row clicks still open sidebar to General tab
- No TypeScript errors
- Maintains existing functionality (other columns, row selection, etc.)
</success_criteria>

<output>
After completion, create `.planning/quick/008-value-radar-hover-click/008-SUMMARY.md`
</output>
