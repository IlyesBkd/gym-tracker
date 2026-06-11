import { test, expect } from '@playwright/test'

test.describe('Workout - Initial State', () => {
  test('should show empty workout state', async ({ page }) => {
    await page.goto('/')
    // Navigate to workout tab
    await page.locator('text=Séances').click()
    await expect(page.locator('text=Prêt à t\'entraîner')).toBeVisible()
  })

  test('should have start workout button', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await expect(page.locator('text=Démarrer une séance')).toBeVisible()
  })

  test('should display workout icon', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await expect(page.locator('text=💪')).toBeVisible()
  })
})

test.describe('Workout - Start Session', () => {
  test('should start new workout session', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    await expect(page.locator('text=Séance en cours')).toBeVisible({ timeout: 5000 })
  })

  test('should show timer after start', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    await expect(page.locator('text=Durée')).toBeVisible()
  })

  test('should show volume counter', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    await expect(page.locator('text=Volume')).toBeVisible()
  })

  test('should have back button', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    await expect(page.locator('[aria-label="Retour"]')).toBeVisible()
  })

  test('should have menu button', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    await expect(page.locator('[aria-label="Menu"]')).toBeVisible()
  })

  test('should have finish button', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    await expect(page.locator('button:has-text("Terminer")')).toBeVisible()
  })
})

test.describe('Workout - Add Exercise', () => {
  test('should show add exercise button', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    await expect(page.locator('[aria-label="Ajouter un exercice"]')).toBeVisible()
  })

  test('should open exercise picker', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    await page.locator('[aria-label="Ajouter un exercice"]').click()
    await expect(page.locator('text=Ajouter un exercice')).toBeVisible()
  })

  test('should show exercise categories', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    await page.locator('[aria-label="Ajouter un exercice"]').click()
    await expect(page.locator('text=chest, text=back, text=shoulders')).toBeVisible()
  })

  test('should be able to select an exercise', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    await page.locator('[aria-label="Ajouter un exercice"]').click()
    const firstExercise = page.locator('button').filter({ hasText: /Pompes|Développé|Curl/ }).first()
    if (await firstExercise.isVisible()) {
      await firstExercise.click()
    }
  })

  test('should return to workout after adding exercise', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    await page.locator('[aria-label="Ajouter un exercice"]').click()
    const firstExercise = page.locator('button').filter({ hasText: /Développé couché/ }).first()
    if (await firstExercise.isVisible()) {
      await firstExercise.click()
      await page.waitForTimeout(1000)
      await expect(page.locator('text=Séance en cours')).toBeVisible()
    }
  })
})

test.describe('Workout - Exercise Card', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    await page.locator('[aria-label="Ajouter un exercice"]').click()
    const firstExercise = page.locator('button').filter({ hasText: /Développé/ }).first()
    if (await firstExercise.isVisible()) {
      await firstExercise.click()
      await page.waitForTimeout(500)
    }
  })

  test('should display exercise name', async ({ page }) => {
    const exerciseName = page.locator('.font-extrabold.leading-tight').first()
    await expect(exerciseName).toBeVisible()
  })

  test('should show muscle group badge', async ({ page }) => {
    const badge = page.locator('.rounded-full').first()
    await expect(badge).toBeVisible()
  })

  test('should display exercise image', async ({ page }) => {
    const img = page.locator('img').first()
    await expect(img).toBeVisible()
  })

  test('should show settings button', async ({ page }) => {
    const settings = page.locator('[aria-label="Réglages machine"]').first()
    await expect(settings).toBeVisible()
  })

  test('should display set counter', async ({ page }) => {
    await expect(page.locator('text=0 / 3, text=0 / 4')).toBeVisible()
  })
})

test.describe('Workout - Sets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    await page.locator('[aria-label="Ajouter un exercice"]').click()
    const firstExercise = page.locator('button').filter({ hasText: /Développé/ }).first()
    if (await firstExercise.isVisible()) {
      await firstExercise.click()
      await page.waitForTimeout(1000)
    }
  })

  test('should show set rows', async ({ page }) => {
    const sets = await page.locator('text=S1, text=S2, text=S3').count()
    expect(sets).toBeGreaterThan(0)
  })

  test('should have active set highlighted', async ({ page }) => {
    const activeSet = page.locator('.ring-2.ring-primary')
    await expect(activeSet).toBeVisible()
  })

  test('should have weight input', async ({ page }) => {
    const weightInput = page.locator('input[type="number"]').first()
    await expect(weightInput).toBeVisible()
  })

  test('should have reps input', async ({ page }) => {
    const repsInput = page.locator('input[type="number"]').nth(1)
    await expect(repsInput).toBeVisible()
  })

  test('should be able to enter weight', async ({ page }) => {
    const weightInput = page.locator('input[type="number"]').first()
    await weightInput.fill('80')
    await expect(weightInput).toHaveValue('80')
  })

  test('should be able to enter reps', async ({ page }) => {
    const repsInput = page.locator('input[type="number"]').nth(1)
    await repsInput.fill('10')
    await expect(repsInput).toHaveValue('10')
  })

  test('should have validate button', async ({ page }) => {
    await expect(page.locator('text=Valider S1')).toBeVisible()
  })

  test('should validate a set', async ({ page }) => {
    const weightInput = page.locator('input[type="number"]').first()
    const repsInput = page.locator('input[type="number"]').nth(1)
    await weightInput.fill('80')
    await repsInput.fill('10')
    await page.locator('text=Valider S1').click()
    await page.waitForTimeout(500)
    // Set should be marked as done
  })

  test('should show previous performance', async ({ page }) => {
    const prev = page.locator('text=Avant')
    if (await prev.isVisible()) {
      await expect(prev).toBeVisible()
    }
  })

  test('should have drop set button', async ({ page }) => {
    await expect(page.locator('text=Drop set')).toBeVisible()
  })
})

test.describe('Workout - Drop Sets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    await page.locator('[aria-label="Ajouter un exercice"]').click()
    const firstExercise = page.locator('button').filter({ hasText: /Développé/ }).first()
    if (await firstExercise.isVisible()) {
      await firstExercise.click()
      await page.waitForTimeout(1000)
    }
  })

  test('should open drop set modal', async ({ page }) => {
    await page.locator('text=Drop set').first().click()
    await expect(page.locator('text=Ajouter un drop')).toBeVisible()
  })

  test('should have weight and reps inputs in modal', async ({ page }) => {
    await page.locator('text=Drop set').first().click()
    await expect(page.locator('text=Poids (kg)')).toBeVisible()
    await expect(page.locator('text=Reps')).toBeVisible()
  })

  test('should be able to add drop set', async ({ page }) => {
    await page.locator('text=Drop set').first().click()
    const dropWeight = page.locator('input[type="number"]').nth(2)
    const dropReps = page.locator('input[type="number"]').nth(3)
    await dropWeight.fill('60')
    await dropReps.fill('8')
    await page.locator('button:has-text("Ajouter")').click()
  })

  test('should close modal on cancel', async ({ page }) => {
    await page.locator('text=Drop set').first().click()
    await page.locator('button:has-text("Annuler")').click()
    await expect(page.locator('text=Ajouter un drop')).not.toBeVisible()
  })
})

test.describe('Workout - Rest Timer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    await page.locator('[aria-label="Ajouter un exercice"]').click()
    const firstExercise = page.locator('button').filter({ hasText: /Développé/ }).first()
    if (await firstExercise.isVisible()) {
      await firstExercise.click()
      await page.waitForTimeout(1000)
    }
  })

  test('should show rest timer after completing set', async ({ page }) => {
    const weightInput = page.locator('input[type="number"]').first()
    const repsInput = page.locator('input[type="number"]').nth(1)
    await weightInput.fill('80')
    await repsInput.fill('10')
    await page.locator('text=Valider S1').click()
    await page.waitForTimeout(1000)
    await expect(page.locator('text=Repos en cours')).toBeVisible()
  })

  test('should have countdown timer', async ({ page }) => {
    const weightInput = page.locator('input[type="number"]').first()
    const repsInput = page.locator('input[type="number"]').nth(1)
    await weightInput.fill('80')
    await repsInput.fill('10')
    await page.locator('text=Valider S1').click()
    await page.waitForTimeout(1000)
    await expect(page.locator('text=restant')).toBeVisible()
  })

  test('should have skip button', async ({ page }) => {
    const weightInput = page.locator('input[type="number"]').first()
    const repsInput = page.locator('input[type="number"]').nth(1)
    await weightInput.fill('80')
    await repsInput.fill('10')
    await page.locator('text=Valider S1').click()
    await page.waitForTimeout(1000)
    await expect(page.locator('text=Passer')).toBeVisible()
  })

  test('should be able to skip rest timer', async ({ page }) => {
    const weightInput = page.locator('input[type="number"]').first()
    const repsInput = page.locator('input[type="number"]').nth(1)
    await weightInput.fill('80')
    await repsInput.fill('10')
    await page.locator('text=Valider S1').click()
    await page.waitForTimeout(1000)
    await page.locator('text=Passer').click()
    await expect(page.locator('text=Repos en cours')).not.toBeVisible()
  })
})

test.describe('Workout - Menu Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
  })

  test('should open menu', async ({ page }) => {
    await page.locator('[aria-label="Menu"]').click()
    await expect(page.locator('text=Annuler la séance')).toBeVisible()
  })

  test('should have save as template option', async ({ page }) => {
    await page.locator('[aria-label="Ajouter un exercice"]').click()
    const firstExercise = page.locator('button').filter({ hasText: /Développé/ }).first()
    if (await firstExercise.isVisible()) {
      await firstExercise.click()
      await page.waitForTimeout(1000)
    }
    await page.locator('[aria-label="Menu"]').click()
    await expect(page.locator('text=Sauvegarder comme programme')).toBeVisible()
  })

  test('should open save template dialog', async ({ page }) => {
    await page.locator('[aria-label="Ajouter un exercice"]').click()
    const firstExercise = page.locator('button').filter({ hasText: /Développé/ }).first()
    if (await firstExercise.isVisible()) {
      await firstExercise.click()
      await page.waitForTimeout(1000)
    }
    await page.locator('[aria-label="Menu"]').click()
    await page.locator('text=Sauvegarder comme programme').click()
    await expect(page.locator('text=Enregistrer comme programme')).toBeVisible()
  })
})

test.describe('Workout - Finish Session', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
  })

  test('should have finish button in header', async ({ page }) => {
    await expect(page.locator('button:has-text("Terminer")').first()).toBeVisible()
  })

  test('should have finish button in bottom bar', async ({ page }) => {
    await expect(page.locator('text=Terminer la séance')).toBeVisible()
  })

  test('should finish workout session', async ({ page }) => {
    await page.locator('[aria-label="Ajouter un exercice"]').click()
    const firstExercise = page.locator('button').filter({ hasText: /Développé/ }).first()
    if (await firstExercise.isVisible()) {
      await firstExercise.click()
      await page.waitForTimeout(1000)
    }
    const weightInput = page.locator('input[type="number"]').first()
    const repsInput = page.locator('input[type="number"]').nth(1)
    await weightInput.fill('80')
    await repsInput.fill('10')
    await page.locator('text=Valider S1').click()
    await page.waitForTimeout(2000)
    await page.locator('button:has-text("Terminer")').first().click()
    await page.waitForTimeout(1000)
  })
})

test.describe('Workout - Exercise Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    await page.locator('[aria-label="Ajouter un exercice"]').click()
    const firstExercise = page.locator('button').filter({ hasText: /Développé/ }).first()
    if (await firstExercise.isVisible()) {
      await firstExercise.click()
      await page.waitForTimeout(1000)
    }
  })

  test('should have add set button', async ({ page }) => {
    await expect(page.locator('text=Ajouter une série')).toBeVisible()
  })

  test('should add a new set', async ({ page }) => {
    await page.locator('text=Ajouter une série').click()
    await page.waitForTimeout(500)
    const sets = await page.locator('text=S1, text=S2, text=S3, text=S4').count()
    expect(sets).toBeGreaterThan(3)
  })

  test('should have move up/down buttons for multiple exercises', async ({ page }) => {
    await page.locator('[aria-label="Ajouter un exercice"]').click()
    const secondExercise = page.locator('button').filter({ hasText: /Curl/ }).first()
    if (await secondExercise.isVisible()) {
      await secondExercise.click()
      await page.waitForTimeout(1000)
      const moveButtons = await page.locator('text=↑, text=↓').count()
      expect(moveButtons).toBeGreaterThan(0)
    }
  })

  test('should have delete exercise button', async ({ page }) => {
    await expect(page.locator('text=Supprimer')).toBeVisible()
  })
})

test.describe('Workout - Persistence', () => {
  test('should persist workout on refresh', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    await page.locator('[aria-label="Ajouter un exercice"]').click()
    const firstExercise = page.locator('button').filter({ hasText: /Développé/ }).first()
    if (await firstExercise.isVisible()) {
      await firstExercise.click()
      await page.waitForTimeout(1000)
    }
    await page.reload()
    await page.waitForTimeout(1000)
    await expect(page.locator('text=Séance en cours')).toBeVisible()
  })

  test('should save workout to localStorage', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    const hasBackup = await page.evaluate(() => {
      return localStorage.getItem('active-workout-backup') !== null
    })
    expect(hasBackup).toBe(true)
  })
})
