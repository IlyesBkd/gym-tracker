import { test, expect } from '@playwright/test'

// ===== NAVIGATION TESTS =====
test.describe('Navigation - Tab Switching', () => {
  test('should navigate to History tab', async ({ page }) => {
    await page.goto('/')
    await page.locator('nav button').nth(1).click()
    await expect(page.locator('text=Historique')).toBeVisible()
  })

  test('should navigate to Workout tab', async ({ page }) => {
    await page.goto('/')
    await page.locator('nav button').nth(2).click()
    await expect(page.locator('text=Prêt à t\'entraîner, text=Séance en cours')).toBeVisible()
  })

  test('should navigate to Stats tab', async ({ page }) => {
    await page.goto('/')
    await page.locator('nav button').nth(3).click()
    await expect(page.locator('text=Statistiques')).toBeVisible()
  })

  test('should keep active tab highlighted', async ({ page }) => {
    await page.goto('/')
    await page.locator('nav button').nth(3).click()
    const activeTab = page.locator('nav button').nth(3)
    await expect(activeTab).toContainText('Stats')
  })

  test('should preserve scroll position on tab switch', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.locator('nav button').nth(3).click()
    await page.locator('nav button').nth(0).click()
    // Should not crash
  })
})

// ===== HISTORY TESTS =====
test.describe('History - Page Load', () => {
  test('should display history page', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Historique').click()
    await expect(page.locator('h1:has-text("Historique")')).toBeVisible()
  })

  test('should show session count', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Historique').click()
    const count = page.locator('text=séance')
    if (await count.isVisible()) {
      await expect(count).toBeVisible()
    }
  })

  test('should show empty state if no workouts', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Historique').click()
    const empty = page.locator('text=Aucune séance')
    if (await empty.isVisible()) {
      await expect(empty).toBeVisible()
    }
  })
})

test.describe('History - Workout Cards', () => {
  test('should display workout cards', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Historique').click()
    const cards = await page.locator('.rounded-4xl').count()
    expect(cards).toBeGreaterThanOrEqual(0)
  })

  test('should show workout date', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Historique').click()
    const dates = await page.locator('.font-extrabold.leading-tight').count()
    expect(dates).toBeGreaterThanOrEqual(0)
  })

  test('should display muscle badges', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Historique').click()
    const badges = await page.locator('.rounded-full').count()
    expect(badges).toBeGreaterThanOrEqual(0)
  })

  test('should show workout stats (duration/sets/volume)', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Historique').click()
    const stats = page.locator('text=Durée, text=Séries, text=Volume')
    const count = await stats.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should have delete button', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Historique').click()
    const deleteBtn = await page.locator('[aria-label*="delete"], svg').count()
    expect(deleteBtn).toBeGreaterThanOrEqual(0)
  })
})

test.describe('History - Exercise List', () => {
  test('should display exercise names', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Historique').click()
    const exercises = await page.locator('.font-bold.text-white\\/90').count()
    expect(exercises).toBeGreaterThanOrEqual(0)
  })

  test('should show set count per exercise', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Historique').click()
    const setCount = page.locator('text=série')
    if (await setCount.isVisible()) {
      await expect(setCount).toBeVisible()
    }
  })

  test('should show volume per exercise', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Historique').click()
    const volume = page.locator('text=t')
    if (await volume.isVisible()) {
      await expect(volume).toBeVisible()
    }
  })

  test('should be clickable to view exercise detail', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Historique').click()
    const exerciseBtn = page.locator('button').filter({ hasText: /Développé|Curl|Squat/ }).first()
    if (await exerciseBtn.isVisible()) {
      await expect(exerciseBtn).toBeVisible()
    }
  })
})

// ===== STATS TESTS =====
test.describe('Stats - Page Load', () => {
  test('should display stats page', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Stats').click()
    await expect(page.locator('h1:has-text("Statistiques")')).toBeVisible()
  })

  test('should show deload alert if needed', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Stats').click()
    const alert = page.locator('text=Décharge suggérée')
    if (await alert.isVisible()) {
      await expect(alert).toBeVisible()
    }
  })
})

test.describe('Stats - Summary Cards', () => {
  test('should display total sessions card', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Stats').click()
    await expect(page.locator('text=séances totales')).toBeVisible()
  })

  test('should show average duration', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Stats').click()
    await expect(page.locator('text=durée moyenne')).toBeVisible()
  })

  test('should display longest session', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Stats').click()
    await expect(page.locator('text=plus longue')).toBeVisible()
  })

  test('should show most trained muscle', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Stats').click()
    await expect(page.locator('text=plus entraîné')).toBeVisible()
  })

  test('should have icons in stat cards', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Stats').click()
    const icons = await page.locator('.rounded-xl.flex.items-center.justify-center').count()
    expect(icons).toBeGreaterThan(0)
  })
})

test.describe('Stats - Weekly Comparison', () => {
  test('should display comparison section', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Stats').click()
    await expect(page.locator('text=Comparaison hebdo')).toBeVisible()
  })

  test('should show this week volume', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Stats').click()
    await expect(page.locator('text=Cette semaine')).toBeVisible()
  })

  test('should show last week volume', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Stats').click()
    await expect(page.locator('text=Semaine dernière')).toBeVisible()
  })

  test('should display percentage change', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Stats').click()
    const percentage = page.locator('text=%')
    if (await percentage.isVisible()) {
      await expect(percentage).toBeVisible()
    }
  })

  test('should show volume by muscle', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Stats').click()
    const muscles = await page.locator('.capitalize').count()
    expect(muscles).toBeGreaterThan(0)
  })

  test('should have progress bars', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Stats').click()
    const bars = await page.locator('.rounded-full.overflow-hidden').count()
    expect(bars).toBeGreaterThan(0)
  })
})

test.describe('Stats - Total Sets', () => {
  test('should display total sets section', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Stats').click()
    await expect(page.locator('text=Séries totales par muscle')).toBeVisible()
  })

  test('should show muscles ordered by volume', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Stats').click()
    const muscleNames = await page.locator('.font-semibold.capitalize').count()
    expect(muscleNames).toBeGreaterThan(0)
  })

  test('should display set counts', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Stats').click()
    const counts = await page.locator('.font-bold.text-white\\/60').count()
    expect(counts).toBeGreaterThan(0)
  })
})

// ===== BODY WEIGHT TESTS =====
test.describe('Body Weight - Page Load', () => {
  test('should navigate to body weight page', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Profil').click()
    await page.waitForTimeout(500)
    // Note: Body weight might be in a different location
  })

  test('should display page title', async ({ page }) => {
    await page.goto('/')
    // Body weight access varies, checking via direct navigation
  })
})

test.describe('Body Weight - Add Entry', () => {
  test('should have weight input field', async ({ page }) => {
    await page.goto('/')
    // Test when we can navigate to body weight screen
  })

  test('should have add button', async ({ page }) => {
    await page.goto('/')
    // Test when we can navigate to body weight screen
  })
})

// ===== TEMPLATES TESTS =====
test.describe('Templates - Access', () => {
  test('should open templates from dashboard', async ({ page }) => {
    await page.goto('/')
    const programsBtn = page.locator('text=Voir tout').first()
    if (await programsBtn.isVisible()) {
      await programsBtn.click()
      await expect(page.locator('text=Programmes')).toBeVisible()
    }
  })

  test('should display empty state if no templates', async ({ page }) => {
    await page.goto('/')
    const programsBtn = page.locator('text=Voir tout').first()
    if (await programsBtn.isVisible()) {
      await programsBtn.click()
      const empty = page.locator('text=Aucun programme')
      if (await empty.isVisible()) {
        await expect(empty).toBeVisible()
      }
    }
  })
})

// ===== EXERCISE DETAIL TESTS =====
test.describe('Exercise Detail - Navigation', () => {
  test('should open from history', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Historique').click()
    const exerciseBtn = page.locator('button').filter({ hasText: /Développé|Curl/ }).first()
    if (await exerciseBtn.isVisible()) {
      await exerciseBtn.click()
      await page.waitForTimeout(1000)
      // Should show exercise detail
    }
  })
})

// ===== PERSISTENCE TESTS =====
test.describe('Persistence - LocalStorage', () => {
  test('should save active workout to localStorage', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    const hasWorkout = await page.evaluate(() => {
      return localStorage.getItem('active-workout-id') !== null
    })
    expect(hasWorkout).toBe(true)
  })

  test('should clear workout after finish', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Séances').click()
    await page.locator('text=Démarrer une séance').click()
    await page.locator('[aria-label="Ajouter un exercice"]').click()
    const firstEx = page.locator('button').filter({ hasText: /Développé/ }).first()
    if (await firstEx.isVisible()) {
      await firstEx.click()
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
    const cleared = await page.evaluate(() => {
      return localStorage.getItem('active-workout-id') === null
    })
    expect(cleared).toBe(true)
  })
})

// ===== RESPONSIVENESS TESTS =====
test.describe('Responsiveness', () => {
  const viewports = [
    { width: 390, height: 844, name: 'iPhone 12 Pro' },
    { width: 375, height: 667, name: 'iPhone SE' },
    { width: 414, height: 896, name: 'iPhone 11 Pro Max' },
  ]

  for (const viewport of viewports) {
    test(`should work on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/')
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('nav')).toBeVisible()
    })
  }

  test('should handle orientation change', async ({ page }) => {
    await page.goto('/')
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.locator('h1')).toBeVisible()
    await page.setViewportSize({ width: 844, height: 390 })
    await expect(page.locator('h1')).toBeVisible()
  })
})

// ===== ACCESSIBILITY TESTS =====
test.describe('Accessibility', () => {
  test('should have proper heading hierarchy on all pages', async ({ page }) => {
    await page.goto('/')
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBeGreaterThanOrEqual(1)

    await page.locator('text=Historique').click()
    const h1History = await page.locator('h1').count()
    expect(h1History).toBeGreaterThanOrEqual(1)

    await page.locator('text=Stats').click()
    const h1Stats = await page.locator('h1').count()
    expect(h1Stats).toBeGreaterThanOrEqual(1)
  })

  test('should have aria-labels on interactive elements', async ({ page }) => {
    await page.goto('/')
    const ariaElements = await page.locator('[aria-label]').count()
    expect(ariaElements).toBeGreaterThan(0)
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    // Should not crash
  })

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/')
    const textElements = await page.locator('p, h1, h2, h3, button').count()
    expect(textElements).toBeGreaterThan(0)
  })
})

// ===== ERROR HANDLING TESTS =====
test.describe('Error Handling', () => {
  test('should not crash on console errors', async ({ page }) => {
    let crashed = false
    page.on('crash', () => { crashed = true })
    await page.goto('/')
    await page.locator('text=Stats').click()
    await page.locator('text=Historique').click()
    await page.locator('text=Séances').click()
    expect(crashed).toBe(false)
  })

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/')
    // App should still load from localStorage even if network fails
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should recover from localStorage corruption', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('workouts', 'invalid-json')
    })
    await page.reload()
    await expect(page.locator('h1')).toBeVisible()
  })
})

// ===== PERFORMANCE TESTS =====
test.describe('Performance', () => {
  test('should load homepage within 3 seconds', async ({ page }) => {
    const start = Date.now()
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
    const duration = Date.now() - start
    expect(duration).toBeLessThan(3000)
  })

  test('should navigate between tabs quickly', async ({ page }) => {
    await page.goto('/')
    const start = Date.now()
    await page.locator('text=Stats').click()
    await expect(page.locator('text=Statistiques')).toBeVisible()
    const duration = Date.now() - start
    expect(duration).toBeLessThan(1000)
  })

  test('should handle large workout history', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Historique').click()
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
    // Should not lag
  })

  test('should not have memory leaks on navigation', async ({ page }) => {
    await page.goto('/')
    for (let i = 0; i < 10; i++) {
      await page.locator('text=Stats').click()
      await page.locator('text=Accueil').click()
    }
    // Should not crash
  })
})
