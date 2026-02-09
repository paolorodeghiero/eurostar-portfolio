---
phase: quick
plan: 007
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/portfolio/ColumnPicker.tsx
  - frontend/src/components/portfolio/PortfolioToolbar.tsx
autonomous: true

must_haves:
  truths:
    - "User can reset column order to default when it has been modified"
    - "Reset button only appears when column order differs from default"
    - "Clicking reset restores defaultColumnOrder immediately"
  artifacts:
    - path: "frontend/src/components/portfolio/ColumnPicker.tsx"
      provides: "Reset column order button alongside column visibility picker"
    - path: "frontend/src/components/portfolio/PortfolioToolbar.tsx"
      provides: "Passes column order state and reset callback to ColumnPicker"
  key_links:
    - from: "ColumnPicker.tsx"
      to: "defaultColumnOrder"
      via: "import from portfolioColumns"
      pattern: "defaultColumnOrder"
    - from: "PortfolioToolbar.tsx"
      to: "ColumnPicker"
      via: "onResetColumnOrder prop"
      pattern: "onResetColumnOrder"
---

<objective>
Add a reset column order button next to the column selector in the portfolio toolbar.

Purpose: Allow users to quickly restore the default column ordering after drag-and-drop reordering.
Output: ColumnPicker with conditional reset button when order has been modified.
</objective>

<context>
@.planning/STATE.md
@frontend/src/components/portfolio/ColumnPicker.tsx
@frontend/src/components/portfolio/PortfolioToolbar.tsx
@frontend/src/components/portfolio/columns/portfolioColumns.tsx (defaultColumnOrder)
@frontend/src/components/portfolio/PortfolioTable.tsx (columnOrder state)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add reset column order functionality to ColumnPicker</name>
  <files>
    frontend/src/components/portfolio/ColumnPicker.tsx
    frontend/src/components/portfolio/PortfolioToolbar.tsx
  </files>
  <action>
Update ColumnPicker.tsx:
1. Add new props: `columnOrder: string[]`, `onResetColumnOrder: () => void`
2. Import `defaultColumnOrder` from `./columns/portfolioColumns`
3. Add helper to check if order differs: compare columnOrder array with defaultColumnOrder (use JSON.stringify for simple comparison)
4. Add a conditional reset button (RotateCcw icon from lucide-react) next to the Columns button
5. Button appears only when column order differs from default
6. Button has tooltip "Reset column order" using title attribute
7. Button variant="ghost" size="sm" with h-8 w-8 p-0 styling
8. On click, call onResetColumnOrder

Update PortfolioToolbar.tsx:
1. Add new props: `columnOrder: string[]`, `onResetColumnOrder: () => void`
2. Pass these props to ColumnPicker component
  </action>
  <verify>
TypeScript compiles: `cd frontend && npx tsc --noEmit`
  </verify>
  <done>
ColumnPicker accepts columnOrder and onResetColumnOrder props. Reset button renders conditionally.
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire up reset functionality in PortfolioPage</name>
  <files>
    frontend/src/pages/PortfolioPage.tsx
  </files>
  <action>
Update PortfolioPage.tsx to pass required props to PortfolioToolbar:
1. PortfolioTable already manages columnOrder state internally via useTableState hook
2. Need to lift columnOrder and setColumnOrder to PortfolioPage level OR expose via PortfolioTable ref
3. PREFERRED: Lift columnOrder state to PortfolioPage:
   - Import useTableState from '@/hooks/useTableState'
   - Import defaultColumnOrder from '@/components/portfolio/columns/portfolioColumns'
   - Add: `const [columnOrder, setColumnOrder] = useTableState<string[]>('portfolio-order', defaultColumnOrder)`
   - Pass columnOrder and onColumnOrderChange to PortfolioTable as props
   - Pass columnOrder and onResetColumnOrder={() => setColumnOrder(defaultColumnOrder)} to PortfolioToolbar

4. Update PortfolioTable to accept optional columnOrder/onColumnOrderChange props:
   - If props provided, use them; otherwise use internal state (backward compatible)
   - This allows parent to control column order when needed
  </action>
  <verify>
Run the app: `cd frontend && npm run dev`
1. Reorder columns by dragging headers
2. Reset button should appear
3. Click reset button - columns return to default order
4. Reset button should disappear after reset
  </verify>
  <done>
Reset column order button appears when order modified, clicking it restores default order, button disappears after reset.
  </done>
</task>

</tasks>

<verification>
1. TypeScript compiles without errors
2. App runs without console errors
3. Reset button only visible when column order differs from default
4. Reset restores defaultColumnOrder and persists to localStorage
</verification>

<success_criteria>
- Reset button appears only when column order has been modified
- Clicking reset restores columns to defaultColumnOrder
- State persists correctly to localStorage
- Button uses consistent styling (ghost variant, RotateCcw icon)
</success_criteria>

<output>
After completion, create `.planning/quick/007-reset-column-order-button/007-SUMMARY.md`
</output>
