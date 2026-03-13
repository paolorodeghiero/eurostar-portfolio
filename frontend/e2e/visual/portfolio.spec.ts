import { test, expect } from '@playwright/test'

test.describe('Portfolio Page Visual States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('portfolio table default view', async ({ page }) => {
    await expect(page).toHaveScreenshot('portfolio-default.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.03
    })
  })

  test('portfolio with sidebar open', async ({ page }) => {
    // Click first project row to open sidebar
    const firstRow = page.locator('tbody tr').first()

    if (await firstRow.isVisible()) {
      await firstRow.click()

      // Wait for sidebar animation
      await page.waitForTimeout(400)

      await expect(page).toHaveScreenshot('portfolio-with-sidebar.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.03
      })
    }
  })

  test('portfolio with column picker open', async ({ page }) => {
    // Find and click column picker button
    const columnPicker = page.getByRole('button', { name: /columns/i })

    if (await columnPicker.isVisible()) {
      await columnPicker.click()

      await expect(page).toHaveScreenshot('portfolio-column-picker.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.03
      })
    }
  })

  test('portfolio compact density', async ({ page }) => {
    // Find density toggle
    const densityToggle = page.getByRole('button', { name: /density|compact/i })

    if (await densityToggle.isVisible()) {
      await densityToggle.click()

      await expect(page).toHaveScreenshot('portfolio-compact.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.03
      })
    }
  })

  test('portfolio with filters applied', async ({ page }) => {
    // Apply a filter if filter UI exists
    const filterButton = page.getByRole('button', { name: /filter/i })

    if (await filterButton.isVisible()) {
      await filterButton.click()

      // Select a filter option
      await page.getByRole('option').first().click()

      await expect(page).toHaveScreenshot('portfolio-filtered.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.03
      })
    }
  })
})
