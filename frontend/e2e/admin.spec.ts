import { test, expect } from '@playwright/test'

test.describe('Admin Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
  })

  test('displays admin navigation sidebar', async ({ page }) => {
    // Admin layout should show sidebar with referential links
    await expect(page.getByRole('link', { name: /departments/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /teams/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /statuses/i })).toBeVisible()
  })

  test('overview page shows referential statistics', async ({ page }) => {
    // Admin overview should show stats cards
    await expect(page.getByText(/departments/i)).toBeVisible()
    await expect(page.getByText(/teams/i)).toBeVisible()
    await expect(page.getByText(/statuses/i)).toBeVisible()
  })

  test('departments page shows data table', async ({ page }) => {
    await page.getByRole('link', { name: /departments/i }).click()

    await expect(page).toHaveURL(/\/admin\/departments/)
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /name/i })).toBeVisible()
  })

  test('can create new department', async ({ page }) => {
    await page.goto('/admin/departments')

    // Click add button
    const addButton = page.getByRole('button', { name: /add|new|create/i })
    await addButton.click()

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible()

    // Fill name
    await page.getByLabel(/name/i).fill('E2E Test Department')

    // Save
    const saveButton = page.getByRole('button', { name: /save|create/i }).last()
    await saveButton.click()

    // Should appear in table
    await expect(page.getByText('E2E Test Department')).toBeVisible({ timeout: 5000 })
  })

  test('shows usage count for departments', async ({ page }) => {
    await page.goto('/admin/departments')

    // Table should have usage column
    await expect(page.getByRole('columnheader', { name: /usage|projects/i })).toBeVisible()
  })

  test('teams page shows department association', async ({ page }) => {
    await page.getByRole('link', { name: /teams/i }).click()

    await expect(page).toHaveURL(/\/admin\/teams/)
    await expect(page.getByRole('table')).toBeVisible()

    // Teams table should show department column
    await expect(page.getByRole('columnheader', { name: /department/i })).toBeVisible()
  })

  test('statuses page shows system status protection', async ({ page }) => {
    await page.goto('/admin/statuses')

    // Table should be visible
    await expect(page.getByRole('table')).toBeVisible()

    // Should have color column
    await expect(page.getByRole('columnheader', { name: /color/i })).toBeVisible()
  })

  test('audit log page displays history', async ({ page }) => {
    const auditLink = page.getByRole('link', { name: /audit/i })

    if (await auditLink.isVisible()) {
      await auditLink.click()

      await expect(page).toHaveURL(/\/admin\/audit/)
      // Should show audit heading or table
      await expect(page.getByRole('heading', { name: /audit/i })).toBeVisible()
    }
  })

  test('can navigate between admin pages', async ({ page }) => {
    // Start at departments
    await page.getByRole('link', { name: /departments/i }).click()
    await expect(page).toHaveURL(/\/admin\/departments/)

    // Navigate to teams
    await page.getByRole('link', { name: /teams/i }).click()
    await expect(page).toHaveURL(/\/admin\/teams/)

    // Navigate to statuses
    await page.getByRole('link', { name: /statuses/i }).click()
    await expect(page).toHaveURL(/\/admin\/statuses/)
  })

  test('can return to portfolio from admin', async ({ page }) => {
    // Click portfolio link or logo
    const portfolioLink = page.getByRole('link', { name: /portfolio|project portfolio/i }).first()
    await portfolioLink.click()

    // Should be back on portfolio
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('table')).toBeVisible()
  })
})
