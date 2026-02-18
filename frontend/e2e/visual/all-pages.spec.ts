import { test, expect } from '@playwright/test'

// All application routes to snapshot
const routes = [
  { path: '/', name: 'portfolio' },
  { path: '/admin', name: 'admin-overview' },
  { path: '/admin/departments', name: 'admin-departments' },
  { path: '/admin/teams', name: 'admin-teams' },
  { path: '/admin/statuses', name: 'admin-statuses' },
  { path: '/admin/outcomes', name: 'admin-outcomes' },
  { path: '/admin/cost-centers', name: 'admin-cost-centers' },
  { path: '/admin/currency-rates', name: 'admin-currency-rates' },
  { path: '/admin/cost-tshirt-thresholds', name: 'admin-cost-thresholds' },
  { path: '/admin/committee-thresholds', name: 'admin-committee-thresholds' },
  { path: '/admin/committee-levels', name: 'admin-committee-levels' },
  { path: '/admin/competence-month-patterns', name: 'admin-competence-patterns' },
  { path: '/admin/budget-lines', name: 'admin-budget-lines' },
  { path: '/admin/audit-log', name: 'admin-audit-log' }
]

for (const route of routes) {
  test(`${route.name} page visual snapshot`, async ({ page }) => {
    await page.goto(route.path)

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Additional wait for any lazy-loaded content
    await page.waitForTimeout(500)

    // Take full-page screenshot
    await expect(page).toHaveScreenshot(`${route.name}.png`, {
      fullPage: true
    })
  })
}
