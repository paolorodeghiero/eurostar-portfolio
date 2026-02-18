import { test, expect } from '@playwright/test'

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for portfolio to load
    await page.waitForLoadState('networkidle')
  })

  test('displays portfolio table with projects', async ({ page }) => {
    // Table should be visible
    const table = page.getByRole('table')
    await expect(table).toBeVisible()

    // Should have header row with common columns
    await expect(page.getByRole('columnheader', { name: /name/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible()
  })

  test('opens project sidebar when clicking row', async ({ page }) => {
    // Click first project row (skip header)
    const rows = page.locator('tbody tr')
    const firstRow = rows.first()

    if (await firstRow.isVisible()) {
      await firstRow.click()

      // Wait for sidebar to appear
      await page.waitForTimeout(300) // Animation delay

      // Sidebar should appear with tabs
      const sidebar = page.locator('[role="dialog"]').or(page.locator('.fixed.right-0'))
      await expect(sidebar).toBeVisible()

      // Should show project tabs
      await expect(page.getByRole('tab', { name: /general/i })).toBeVisible()
    }
  })

  test('can create new project', async ({ page }) => {
    // Find and click new project button
    const newButton = page.getByRole('button', { name: /new project|create/i })
    await newButton.click()

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible()

    // Fill in project name
    const nameInput = page.getByLabel(/name/i).first()
    await nameInput.fill('E2E Test Project')

    // Submit form
    const submitButton = page.getByRole('button', { name: /create|save/i }).last()
    await submitButton.click()

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    // New project should appear in table
    await expect(page.getByText('E2E Test Project')).toBeVisible({ timeout: 5000 })
  })

  test('can filter projects by search', async ({ page }) => {
    // Find search input
    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i))

    if (await searchInput.isVisible()) {
      await searchInput.fill('nonexistent-project-xyz-999')

      // Wait for filter to apply (debounce)
      await page.waitForTimeout(500)

      // Table should show no results or empty state
      const bodyRows = page.locator('tbody tr')
      const count = await bodyRows.count()
      expect(count).toBe(0)
    }
  })

  test('can close sidebar with escape key', async ({ page }) => {
    // Open a project first
    const rows = page.locator('tbody tr')
    const firstRow = rows.first()

    if (await firstRow.isVisible()) {
      await firstRow.click()
      await page.waitForTimeout(300)

      // Verify sidebar is open
      const sidebar = page.locator('[role="dialog"]').or(page.locator('.fixed.right-0'))
      await expect(sidebar).toBeVisible()

      // Close sidebar with Escape
      await page.keyboard.press('Escape')

      // Sidebar should be gone
      await expect(sidebar).not.toBeVisible({ timeout: 1000 })
    }
  })

  test('toolbar shows action buttons', async ({ page }) => {
    // Check for toolbar actions
    const toolbar = page.locator('header').or(page.locator('[class*="toolbar"]'))
    await expect(toolbar).toBeVisible()

    // Should have upload button
    await expect(page.getByRole('button', { name: /upload actuals/i })).toBeVisible()

    // Should have admin link
    await expect(page.getByRole('link', { name: /admin/i })).toBeVisible()
  })

  test('displays project columns', async ({ page }) => {
    // Verify key columns are present
    const headers = [
      /name/i,
      /status/i,
      /lead/i,
      /value/i,
      /budget/i
    ]

    for (const headerPattern of headers) {
      const header = page.getByRole('columnheader', { name: headerPattern }).first()
      await expect(header).toBeVisible()
    }
  })
})
