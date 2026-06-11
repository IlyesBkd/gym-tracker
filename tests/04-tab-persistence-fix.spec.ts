import { test, expect } from '@playwright/test'

test.describe('Tab Persistence - Bug Fix', () => {
  test('should save active tab to localStorage', async ({ page }) => {
    await page.goto('/')

    // Switch to Stats tab
    await page.locator('text=Stats').click()
    await expect(page.locator('h1:has-text("Statistiques")')).toBeVisible()

    // Check localStorage
    const savedTab = await page.evaluate(() => {
      return localStorage.getItem('active-tab')
    })
    expect(savedTab).toBe('stats')
  })

  test('should restore active tab after refresh', async ({ page }) => {
    await page.goto('/')

    // Switch to History tab
    await page.locator('text=Historique').click()
    await expect(page.locator('h1:has-text("Historique")')).toBeVisible()

    // Refresh page
    await page.reload()
    await page.waitForTimeout(1000)

    // Should still be on History tab
    await expect(page.locator('h1:has-text("Historique")')).toBeVisible()
  })

  test('should persist workout tab', async ({ page }) => {
    await page.goto('/')

    // Switch to Workout tab
    await page.locator('nav button').nth(2).click()
    await page.waitForTimeout(500)

    // Refresh
    await page.reload()
    await page.waitForTimeout(1000)

    // Should still be on Workout tab
    const workoutTab = page.locator('text=Prêt à t\'entraîner, text=Séance en cours')
    await expect(workoutTab).toBeVisible()
  })

  test('should default to dashboard if no saved tab', async ({ page }) => {
    // Clear localStorage
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('active-tab')
    })

    // Reload
    await page.reload()
    await page.waitForTimeout(1000)

    // Should be on Dashboard
    await expect(page.locator('text=Salut')).toBeVisible()
  })

  test('should handle invalid saved tab gracefully', async ({ page }) => {
    await page.goto('/')

    // Set invalid tab
    await page.evaluate(() => {
      localStorage.setItem('active-tab', 'invalid-tab')
    })

    // Reload
    await page.reload()
    await page.waitForTimeout(1000)

    // Should fallback to dashboard (or still work)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should persist tab across multiple refreshes', async ({ page }) => {
    await page.goto('/')

    // Switch to Stats
    await page.locator('text=Stats').click()
    await expect(page.locator('text=Statistiques')).toBeVisible()

    // Refresh 3 times
    for (let i = 0; i < 3; i++) {
      await page.reload()
      await page.waitForTimeout(500)
      await expect(page.locator('text=Statistiques')).toBeVisible()
    }
  })

  test('should update localStorage on every tab change', async ({ page }) => {
    await page.goto('/')

    const tabs = ['Stats', 'Historique', 'Accueil', 'Stats']
    const expectedValues = ['stats', 'history', 'dashboard', 'stats']

    for (let i = 0; i < tabs.length; i++) {
      await page.locator(`text=${tabs[i]}`).click()
      await page.waitForTimeout(300)

      const saved = await page.evaluate(() => {
        return localStorage.getItem('active-tab')
      })
      expect(saved).toBe(expectedValues[i])
    }
  })
})
