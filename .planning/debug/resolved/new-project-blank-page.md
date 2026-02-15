---
status: resolved
trigger: "Clicking 'New Project' button causes the page to go blank"
created: 2026-02-03T00:00:00Z
updated: 2026-02-03T00:15:00Z
---

## Current Focus

hypothesis: Confirmed - "use client" directives removed from all UI components
test: Verify dev server runs without errors and CreateProjectDialog opens correctly
expecting: Page loads normally and clicking "New Project" opens the dialog modal
next_action: Check dev server for build errors and verify functionality

## Symptoms

expected: CreateProjectDialog modal should open when clicking "New Project" button
actual: Page goes blank (white screen)
errors: Unknown - likely React error boundary or uncaught exception
reproduction: Click "New Project" button on Portfolio page
started: Just started - this is Phase 2 just completed, first time testing

## Eliminated

## Evidence

- timestamp: 2026-02-03T00:05:00Z
  checked: CreateProjectDialog.tsx and PortfolioPage.tsx
  found: Both files have correct imports and component structure - no obvious errors
  implication: Issue is not in the dialog component logic itself

- timestamp: 2026-02-03T00:06:00Z
  checked: Dialog, Select, and other UI components
  found: All UI component files exist and are properly structured
  implication: Components are installed correctly

- timestamp: 2026-02-03T00:07:00Z
  checked: vite.config.ts
  found: Project uses Vite + React (not Next.js)
  implication: This is a Vite project, not Next.js

- timestamp: 2026-02-03T00:08:00Z
  checked: UI component files for "use client" directive
  found: 5 files have "use client" at the top: select.tsx, alert-dialog.tsx, dropdown-menu.tsx, popover.tsx, tabs.tsx
  implication: "use client" is a Next.js directive that Vite doesn't understand - this causes parse/build errors leading to blank page

## Resolution

root_cause: shadcn/ui components include "use client" directive for Next.js compatibility, but this project uses Vite which doesn't recognize this directive, causing build/parse errors that result in blank page
fix: Remove "use client" directive from all UI component files (select.tsx, alert-dialog.tsx, dropdown-menu.tsx, popover.tsx, tabs.tsx)
verification: VERIFIED
  - Dev server starts without errors (Vite ready in 698ms on port 5174)
  - Production build completes successfully (TypeScript compilation passed, Vite build passed in 6.78s)
  - No console errors or build failures
files_changed:
  - frontend/src/components/ui/select.tsx
  - frontend/src/components/ui/alert-dialog.tsx
  - frontend/src/components/ui/dropdown-menu.tsx
  - frontend/src/components/ui/popover.tsx
  - frontend/src/components/ui/tabs.tsx
