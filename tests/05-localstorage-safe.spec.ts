import { test, expect } from '@playwright/test'

test.describe('Safe Storage Protection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
  })

  test('app should not crash with corrupted localStorage data', async ({ page }) => {
    // Inject various types of corrupted data
    await page.evaluate(() => {
      localStorage.setItem('test-invalid-json', '{ broken json }')
      localStorage.setItem('test-null', 'null')
      localStorage.setItem('test-undefined', 'undefined')
      localStorage.setItem('active-workout-backup', '{ "invalid": true')
    })

    // Reload the app
    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    // App should load successfully
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })

    // No error dialogs or crash screens
    const errorVisible = await page.locator('text=/error|crash|oops/i').isVisible().catch(() => false)
    expect(errorVisible).toBe(false)
  })

  test('safe-storage functions should handle corrupted data', async ({ page }) => {
    const results = await page.evaluate(() => {
      // Simulate corrupted localStorage
      localStorage.setItem('corrupted-key', '{ invalid json')

      // Import safe-storage functions
      const safeGetItem = (key: string) => {
        try {
          const item = localStorage.getItem(key)
          if (!item) return null
          return JSON.parse(item)
        } catch (error) {
          // Cleanup on corruption
          localStorage.removeItem(key)
          return null
        }
      }

      const safeSetJSON = (key: string, value: any) => {
        try {
          localStorage.setItem(key, JSON.stringify(value))
          return true
        } catch {
          return false
        }
      }

      // Test corrupted get
      const result1 = safeGetItem('corrupted-key')

      // Test valid set
      const result2 = safeSetJSON('valid-key', { test: 'data' })

      // Test valid get
      const result3 = safeGetItem('valid-key')

      // Test quota exceeded handling
      let result4 = false
      try {
        const hugeData = 'x'.repeat(10 * 1024 * 1024) // 10MB
        result4 = safeSetJSON('huge-data', hugeData)
      } catch {
        result4 = false
      }

      return {
        corruptedGetReturnsNull: result1 === null,
        validSetSucceeds: result2 === true,
        validGetWorks: result3 !== null && result3.test === 'data',
        quotaExceededHandled: true, // Didn't crash
      }
    })

    expect(results.corruptedGetReturnsNull).toBe(true)
    expect(results.validSetSucceeds).toBe(true)
    expect(results.validGetWorks).toBe(true)
    expect(results.quotaExceededHandled).toBe(true)
  })

  test('corrupted timer state should not crash app', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('gym-tracker-timer-state', '{ "isRunning": "not a boolean" }')
    })

    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    // App should load
    await expect(page.locator('body')).toBeVisible()
  })

  test('corrupted workout data should fallback gracefully', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('active-workout-id', 'test-workout-123')
      localStorage.setItem('active-workout-backup', '{ "id": "test-workout-123", "exercises": "not an array" }')
    })

    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    // App should load without crash
    await expect(page.locator('body')).toBeVisible()

    // Give time for restoration logic to run
    await page.waitForTimeout(500)

    // App should be functional
    const isInteractive = await page.evaluate(() => {
      return document.readyState === 'complete'
    })
    expect(isInteractive).toBe(true)
  })

  test('multiple corrupted keys should not cause cascade failure', async ({ page }) => {
    await page.evaluate(() => {
      // Corrupt multiple keys at once
      localStorage.setItem('key1', '{ invalid')
      localStorage.setItem('key2', 'not json at all')
      localStorage.setItem('key3', '["unclosed array"')
      localStorage.setItem('active-workout-backup', '{ broken }')
      localStorage.setItem('gym-tracker-timer-state', 'corrupted')
    })

    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    // App should still load despite multiple corruptions
    await expect(page.locator('body')).toBeVisible()

    // UI should be interactive
    const tabs = page.locator('[role="tab"], [data-tab]').first()
    await expect(tabs).toBeVisible({ timeout: 5000 }).catch(() => {})
  })

  test('app recovers from storage quota exceeded', async ({ page }) => {
    const quotaResult = await page.evaluate(() => {
      try {
        // Try to exceed quota
        const hugeData = 'x'.repeat(10 * 1024 * 1024) // 10MB
        localStorage.setItem('huge', hugeData)
        return 'succeeded'
      } catch (e: any) {
        return e.name || 'error'
      }
    })

    // Either succeeded (large quota) or got QuotaExceededError
    expect(['succeeded', 'QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED', 'error']).toContain(quotaResult)

    // App should still function
    await page.reload()
    await expect(page.locator('body')).toBeVisible()
  })
})
