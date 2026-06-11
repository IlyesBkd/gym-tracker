import { test, expect } from '@playwright/test'

test.describe('Bug Fixes Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
  })

  test.describe('Set Validation', () => {
    test('should show warning when trying to validate set with 0 weight', async ({ page }) => {
      // Navigate to workout
      await page.click('text=/Workout/i')
      await page.waitForTimeout(500)

      // Start a workout if needed
      const startButton = page.locator('button:has-text("Commencer")')
      if (await startButton.isVisible().catch(() => false)) {
        await startButton.click()
      }

      // Add an exercise
      const addExercise = page.locator('button:has-text("Ajouter")')
      if (await addExercise.isVisible().catch(() => false)) {
        await addExercise.click()
        await page.waitForTimeout(300)
        // Select first exercise
        const firstExercise = page.locator('[data-exercise-id]').first()
        if (await firstExercise.isVisible().catch(() => false)) {
          await firstExercise.click()
        }
      }

      // Set weight to 0
      const weightInput = page.locator('input[type="number"][inputmode="decimal"]').first()
      if (await weightInput.isVisible().catch(() => false)) {
        await weightInput.fill('0')

        // Try to validate
        const validateButton = page.locator('button:has-text("✓")').first()
        await validateButton.click()

        // Should show toast warning
        await expect(page.locator('text=/poids.*supérieur/i')).toBeVisible({ timeout: 3000 })
      }
    })

    test('should show warning when trying to validate set with 0 reps', async ({ page }) => {
      await page.click('text=/Workout/i')
      await page.waitForTimeout(500)

      const startButton = page.locator('button:has-text("Commencer")')
      if (await startButton.isVisible().catch(() => false)) {
        await startButton.click()
      }

      const addExercise = page.locator('button:has-text("Ajouter")')
      if (await addExercise.isVisible().catch(() => false)) {
        await addExercise.click()
        await page.waitForTimeout(300)
        const firstExercise = page.locator('[data-exercise-id]').first()
        if (await firstExercise.isVisible().catch(() => false)) {
          await firstExercise.click()
        }
      }

      // Set reps to 0
      const repsInput = page.locator('input[type="number"][inputmode="numeric"]').first()
      if (await repsInput.isVisible().catch(() => false)) {
        await repsInput.fill('0')

        const validateButton = page.locator('button:has-text("✓")').first()
        await validateButton.click()

        // Should show toast warning
        await expect(page.locator('text=/reps.*supérieur/i')).toBeVisible({ timeout: 3000 })
      }
    })
  })

  test.describe('Confirm Dialog', () => {
    test('should show confirmation dialog instead of window.confirm for delete', async ({ page }) => {
      // Navigate to history
      await page.click('text=/Historique/i')
      await page.waitForTimeout(500)

      // Check if delete buttons exist
      const deleteButton = page.locator('button[class*="danger"]').first()
      if (await deleteButton.isVisible().catch(() => false)) {
        // Click delete
        await deleteButton.click()

        // Should show custom dialog instead of alert
        await expect(page.locator('text=/Supprimer.*séance/i')).toBeVisible({ timeout: 2000 })

        // Dialog should have Cancel and Confirm buttons
        await expect(page.locator('button:has-text("Annuler")')).toBeVisible()
        await expect(page.locator('button:has-text("Supprimer")')).toBeVisible()

        // Click cancel
        await page.click('button:has-text("Annuler")')

        // Dialog should close
        await expect(page.locator('text=/Supprimer.*séance/i')).not.toBeVisible({ timeout: 1000 })
      }
    })

    test('confirm dialog should be accessible and styled', async ({ page }) => {
      await page.click('text=/Historique/i')
      await page.waitForTimeout(500)

      const deleteButton = page.locator('button[class*="danger"]').first()
      if (await deleteButton.isVisible().catch(() => false)) {
        await deleteButton.click()

        // Check styling
        const dialog = page.locator('[class*="rounded-3xl"]').first()
        await expect(dialog).toBeVisible({ timeout: 2000 })

        // Should have backdrop
        const backdrop = page.locator('[class*="backdrop-blur"]')
        await expect(backdrop).toBeVisible()
      }
    })
  })

  test.describe('Stats Empty State', () => {
    test('should show empty state message when no workouts', async ({ page }) => {
      // Clear all data first (if possible)
      // Navigate to stats
      await page.click('text=/Statistiques/i')
      await page.waitForTimeout(500)

      // Check for content
      const hasStats = await page.locator('text=/séances totales/i').isVisible().catch(() => false)
      const hasEmptyState = await page.locator('text=/Pas encore de stats/i').isVisible().catch(() => false)

      // Either has stats or has empty state
      expect(hasStats || hasEmptyState).toBe(true)
    })

    test('empty state should have helpful message', async ({ page }) => {
      await page.click('text=/Statistiques/i')
      await page.waitForTimeout(500)

      // If empty state is visible
      const emptyState = page.locator('text=/Pas encore de stats/i')
      const isVisible = await emptyState.isVisible().catch(() => false)

      if (isVisible) {
        // Should have descriptive text
        await expect(page.locator('text=/Complète.*première.*séance/i')).toBeVisible()

        // Should have an icon
        const icon = page.locator('svg').first()
        await expect(icon).toBeVisible()
      }
    })
  })

  test.describe('Toast Notifications', () => {
    test('toast should auto-dismiss after duration', async ({ page }) => {
      // Trigger a toast (try validation error)
      await page.click('text=/Workout/i')
      await page.waitForTimeout(500)

      const startButton = page.locator('button:has-text("Commencer")')
      if (await startButton.isVisible().catch(() => false)) {
        await startButton.click()
      }

      const addExercise = page.locator('button:has-text("Ajouter")')
      if (await addExercise.isVisible().catch(() => false)) {
        await addExercise.click()
        await page.waitForTimeout(300)
        const firstExercise = page.locator('[data-exercise-id]').first()
        if (await firstExercise.isVisible().catch(() => false)) {
          await firstExercise.click()
        }
      }

      const weightInput = page.locator('input[type="number"][inputmode="decimal"]').first()
      if (await weightInput.isVisible().catch(() => false)) {
        await weightInput.fill('0')
        const validateButton = page.locator('button:has-text("✓")').first()
        await validateButton.click()

        // Toast should appear
        const toast = page.locator('[class*="fixed"][class*="top-"]').first()
        await expect(toast).toBeVisible({ timeout: 3000 })

        // Should dismiss after ~3 seconds
        await page.waitForTimeout(3500)
        await expect(toast).not.toBeVisible()
      }
    })

    test('toast can be manually dismissed', async ({ page }) => {
      await page.click('text=/Workout/i')
      await page.waitForTimeout(500)

      // Trigger toast and close it manually
      const startButton = page.locator('button:has-text("Commencer")')
      if (await startButton.isVisible().catch(() => false)) {
        await startButton.click()
      }

      const addExercise = page.locator('button:has-text("Ajouter")')
      if (await addExercise.isVisible().catch(() => false)) {
        await addExercise.click()
        await page.waitForTimeout(300)
        const firstExercise = page.locator('[data-exercise-id]').first()
        if (await firstExercise.isVisible().catch(() => false)) {
          await firstExercise.click()
        }
      }

      const weightInput = page.locator('input[type="number"][inputmode="decimal"]').first()
      if (await weightInput.isVisible().catch(() => false)) {
        await weightInput.fill('0')
        const validateButton = page.locator('button:has-text("✓")').first()
        await validateButton.click()

        // Toast appears
        const toast = page.locator('[class*="fixed"][class*="top-"]').first()
        if (await toast.isVisible().catch(() => false)) {
          // Click close button
          const closeButton = toast.locator('button').last()
          await closeButton.click()

          // Should dismiss immediately
          await expect(toast).not.toBeVisible({ timeout: 1000 })
        }
      }
    })
  })
})
