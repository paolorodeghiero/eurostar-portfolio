---
phase: quick
plan: 009
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/projects/ProjectTabs.tsx
autonomous: true

must_haves:
  truths:
    - "Sidebar tabs appear in order: General, Effort, Change Impact, Value, Budget, Committee, Actuals, History"
  artifacts:
    - path: "frontend/src/components/projects/ProjectTabs.tsx"
      provides: "Reordered tabs array"
      contains: "{ id: 'general'"
  key_links: []
---

<objective>
Reorder project sidebar tabs to match the requested sequence.

Purpose: Improve information architecture by grouping related concepts (Effort before Impact, Budget before Committee).
Output: Updated tab order in ProjectTabs.tsx
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/components/projects/ProjectTabs.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Reorder tabs array in ProjectTabs.tsx</name>
  <files>frontend/src/components/projects/ProjectTabs.tsx</files>
  <action>
Update the `tabs` array (lines 21-30) to the new order:
1. general - General
2. effort - Effort
3. change-impact - Change Impact
4. value - Value
5. budget - Budget
6. committee - Committee
7. actuals - Actuals
8. history - History

Also reorder the TabsContent elements (lines 57-92) to match:
1. general
2. effort
3. change-impact
4. value
5. budget
6. committee
7. actuals
8. history

This maintains consistency between the tabs array and the rendered content order.
  </action>
  <verify>
Run `npm run build` in frontend directory - should compile without errors.
Visually confirm tab order in browser matches: General, Effort, Change Impact, Value, Budget, Committee, Actuals, History.
  </verify>
  <done>
Sidebar tabs display in the requested order when opening any project.
  </done>
</task>

</tasks>

<verification>
- Build passes: `cd frontend && npm run build`
- Tab order matches specification when viewing project sidebar
</verification>

<success_criteria>
- Tabs appear in order: General, Effort, Change Impact, Value, Budget, Committee, Actuals, History
- No build errors
- Tab navigation still works correctly
</success_criteria>

<output>
After completion, create `.planning/quick/009-reorder-sidebar-sections/009-SUMMARY.md`
</output>
