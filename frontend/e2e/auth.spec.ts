import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('loads application in dev mode', async ({ page }) => {
    await page.goto('/')

    // In dev mode, should load directly without login prompt
    await expect(page).toHaveTitle(/Eurostar Portfolio/i)

    // Portfolio table should be visible
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('shows dev mode indicator and user info', async ({ page }) => {
    await page.goto('/')

    // Dev mode shows DEV badge
    await expect(page.getByText('DEV')).toBeVisible()

    // Should show user initials
    const userCircle = page.locator('.rounded-full.bg-white\\/20').first()
    await expect(userCircle).toBeVisible()
  })

  test('admin link navigates to admin area', async ({ page }) => {
    await page.goto('/')

    // Find and click admin link
    await page.getByRole('link', { name: /admin/i }).click()

    // Should be on admin page
    await expect(page).toHaveURL(/\/admin/)
    await expect(page.getByText(/referential/i)).toBeVisible()
  })

  test('shows Eurostar branding', async ({ page }) => {
    await page.goto('/')

    // Check for logo and title
    await expect(page.locator('img[alt="Eurostar"]')).toBeVisible()
    await expect(page.getByText('Project Portfolio')).toBeVisible()
  })
})
