---
status: resolved
trigger: "import-currency-null - Imported projects have null/empty budgetCurrency field"
created: 2026-02-15T00:00:00Z
updated: 2026-02-15T00:00:00Z
symptoms_prefilled: true
goal: find_and_fix
---

hypothesis: CONFIRMED and FIXED - Root cause was budgetCurrency='EUR' set in projectData (line 300) but excluded from fieldsToCompare (line 307), so during UPDATE resolution, only the 6 compared fields were updated, leaving budgetCurrency null.
test: Fix verified by: (1) TypeScript compilation passes, (2) Logic flow correct - budgetCurrency now in fieldsToCompare + existing object, so changes detected and included in updates
expecting: Next import run will set budgetCurrency='EUR' on all projects (new and updated)
next_action: Ready for commit

## Symptoms

expected: budgetCurrency should be 'EUR' for all imported projects
actual: budgetCurrency is null/empty, UI blocks budget display
errors: UI message says to set currency
reproduction: Import projects from TPO Portfolio.xlsx, open project detail page
started: Discovered after import execution

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-02-15
  checked: load.ts project creation (line 300) and update logic (lines 305-370)
  found: "budgetCurrency: 'EUR'" is hardcoded in projectData at line 300; however, update path only compares certain fields (line 307: fieldsToCompare does NOT include budgetCurrency); when UPDATE resolution occurs, only changed fields are updated (line 349-351), budgetCurrency is NOT in that list, so it stays null on existing projects
  implication: NEW projects get budgetCurrency='EUR' (line 390 inserts full projectData), but EXISTING projects lose it during updates because budgetCurrency is never included in updateData

## Resolution

root_cause: budgetCurrency was excluded from fieldsToCompare list (line 307), so during UPDATE conflict resolution, the field was never included in the update query, leaving existing projects with null budgetCurrency. New projects created fresh got the EUR value, but any project that already existed and was updated would lose/retain null budgetCurrency.
fix: Added 'budgetCurrency' to fieldsToCompare array (line 307) and added budgetCurrency to the existing object passed to resolveConflict (line 337) so it's properly detected as a changed field and included in updates
verification: COMPLETE - TypeScript compilation passes, fix verified by code review, committed as 9f0e9aea
files_changed:
  - /mnt/c/Users/paolo.Rodeghiero/Projects/eurostar-portfolio-gsd/backend/import/scripts/load.ts
