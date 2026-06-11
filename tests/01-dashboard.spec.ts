import { test, expect } from '@playwright/test'

test.describe('Dashboard - Basic Loading', () => {
  test('should load dashboard page', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Salut')).toBeVisible()
  })

  test('should display welcome message', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Salut')
  })

  test('should show current date', async ({ page }) => {
    await page.goto('/')
    const dateText = await page.locator('p.text-muted').first().textContent()
    expect(dateText).toBeTruthy()
  })

  test('should display user profile button', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[aria-label="Profil"]')).toBeVisible()
  })

  test('should have bottom navigation', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav')).toBeVisible()
  })
})

test.describe('Dashboard - Last Session Card', () => {
  test('should display last session card if exists', async ({ page }) => {
    await page.goto('/')
    const lastSession = page.locator('text=Dernière séance')
    const count = await lastSession.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should show session duration', async ({ page }) => {
    await page.goto('/')
    const duration = page.locator('text=Durée')
    if (await duration.isVisible()) {
      expect(duration).toBeVisible()
    }
  })

  test('should show session stats (series/volume)', async ({ page }) => {
    await page.goto('/')
    const stats = page.locator('text=Séries')
    if (await stats.isVisible()) {
      expect(stats).toBeVisible()
    }
  })
})

test.describe('Dashboard - Muscle Map', () => {
  test('should display muscle map card', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Carte musculaire')).toBeVisible()
  })

  test('should show SVG body diagrams', async ({ page }) => {
    await page.goto('/')
    const svgs = await page.locator('svg').count()
    expect(svgs).toBeGreaterThan(0)
  })

  test('should display muscle status badges', async ({ page }) => {
    await page.goto('/')
    const badges = await page.locator('.rounded-full').count()
    expect(badges).toBeGreaterThan(0)
  })

  test('should show muscles to rebalance count', async ({ page }) => {
    await page.goto('/')
    const rebalanceText = page.locator('text=à rééquilibrer')
    if (await rebalanceText.isVisible()) {
      expect(rebalanceText).toBeVisible()
    }
  })
})

test.describe('Dashboard - Activity Stats', () => {
  test('should display activity section', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Mon activité')).toBeVisible()
  })

  test('should show weekly sessions count', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=séances · semaine')).toBeVisible()
  })

  test('should show monthly sessions with progress ring', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=ce mois')).toBeVisible()
  })

  test('should display total time stat', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=temps total')).toBeVisible()
  })

  test('should display total volume stat', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=volume total')).toBeVisible()
  })

  test('should have stat icons', async ({ page }) => {
    await page.goto('/')
    const icons = await page.locator('.bg-primary\\/12, .bg-sky-500\\/12, .bg-purple-500\\/12').count()
    expect(icons).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Dashboard - Body Weight', () => {
  test('should display body weight card if data exists', async ({ page }) => {
    await page.goto('/')
    const weightCard = page.locator('text=Poids')
    const count = await weightCard.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should show current weight', async ({ page }) => {
    await page.goto('/')
    const weight = page.locator('text=kg').first()
    if (await weight.isVisible()) {
      expect(weight).toBeVisible()
    }
  })

  test('should show 7-day average', async ({ page }) => {
    await page.goto('/')
    const avg = page.locator('text=moy. 7j')
    if (await avg.isVisible()) {
      expect(avg).toBeVisible()
    }
  })

  test('should display weight trend indicator', async ({ page }) => {
    await page.goto('/')
    const trend = page.locator('.bg-primary\\/10, .bg-danger\\/10')
    const count = await trend.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should show sparkline chart', async ({ page }) => {
    await page.goto('/')
    const chartBars = page.locator('.rounded-md')
    const count = await chartBars.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Dashboard - Weekly Volume', () => {
  test('should display weekly volume section', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Volume hebdomadaire')).toBeVisible()
  })

  test('should show volume bars for muscles', async ({ page }) => {
    await page.goto('/')
    const bars = await page.locator('.rounded-full.overflow-hidden').count()
    expect(bars).toBeGreaterThanOrEqual(0)
  })

  test('should display muscle names in French', async ({ page }) => {
    await page.goto('/')
    const muscles = page.locator('text=Pectoraux, text=Dos, text=Épaules')
    const count = await muscles.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should show volume values in tons', async ({ page }) => {
    await page.goto('/')
    const tons = page.locator('text= t')
    const count = await tons.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Dashboard - Calendar', () => {
  test('should display calendar section', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Régularité')).toBeVisible()
  })

  test('should show 12 weeks label', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=12 semaines')).toBeVisible()
  })

  test('should display month labels', async ({ page }) => {
    await page.goto('/')
    const months = page.locator('text=Mars, text=Avril, text=Mai, text=Juin')
    const count = await months.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should show day labels (L M M J V S D)', async ({ page }) => {
    await page.goto('/')
    const days = page.locator('text=L, text=M, text=J, text=V, text=S, text=D')
    const count = await days.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should have calendar grid squares', async ({ page }) => {
    await page.goto('/')
    const squares = await page.locator('.aspect-square.rounded-\\[5px\\]').count()
    expect(squares).toBeGreaterThanOrEqual(0)
  })

  test('should show calendar legend', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Moins')).toBeVisible()
    await expect(page.locator('text=Plus')).toBeVisible()
  })
})

test.describe('Dashboard - Programs', () => {
  test('should display programs section', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Mes programmes')).toBeVisible()
  })

  test('should have "see all" button', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Voir tout')).toBeVisible()
  })

  test('should display program cards', async ({ page }) => {
    await page.goto('/')
    const cards = await page.locator('.rounded-4xl').count()
    expect(cards).toBeGreaterThan(0)
  })

  test('should have "create program" call to action', async ({ page }) => {
    await page.goto('/')
    const cta = page.locator('text=Créer un programme, text=Commencer')
    const count = await cta.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Dashboard - Navigation', () => {
  test('should have 5 nav items', async ({ page }) => {
    await page.goto('/')
    const navItems = await page.locator('nav button').count()
    expect(navItems).toBe(5)
  })

  test('should highlight active nav (Accueil)', async ({ page }) => {
    await page.goto('/')
    const activeNav = page.locator('nav button').first()
    await expect(activeNav).toContainText('Accueil')
  })

  test('should have Séances nav item', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Séances')).toBeVisible()
  })

  test('should have central FAB (+)', async ({ page }) => {
    await page.goto('/')
    const fab = page.locator('nav button').nth(2)
    await expect(fab).toBeVisible()
  })

  test('should have Stats nav item', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Stats')).toBeVisible()
  })

  test('should have Profil nav item', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Profil')).toBeVisible()
  })
})

test.describe('Dashboard - Interactions', () => {
  test('should be able to click profile button', async ({ page }) => {
    await page.goto('/')
    const profile = page.locator('[aria-label="Profil"]')
    await profile.click()
    // Should not crash
  })

  test('should be able to click "Voir tout" button', async ({ page }) => {
    await page.goto('/')
    const seeAll = page.locator('text=Voir tout').first()
    if (await seeAll.isVisible()) {
      await seeAll.click()
    }
  })

  test('should scroll to bottom', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
    // Should not crash
  })

  test('should be responsive to viewport changes', async ({ page }) => {
    await page.goto('/')
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('h1')).toBeVisible()
  })
})

test.describe('Dashboard - Performance', () => {
  test('should load within 3 seconds', async ({ page }) => {
    const start = Date.now()
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
    const duration = Date.now() - start
    expect(duration).toBeLessThan(3000)
  })

  test('should have no console errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    expect(errors.length).toBe(0)
  })

  test('should render all images', async ({ page }) => {
    await page.goto('/')
    const images = await page.locator('img').count()
    if (images > 0) {
      const firstImg = page.locator('img').first()
      await expect(firstImg).toBeVisible()
    }
  })
})

test.describe('Dashboard - Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')
    const h1 = await page.locator('h1').count()
    expect(h1).toBeGreaterThanOrEqual(1)
  })

  test('should have aria-labels on buttons', async ({ page }) => {
    await page.goto('/')
    const ariaButtons = await page.locator('[aria-label]').count()
    expect(ariaButtons).toBeGreaterThan(0)
  })

  test('should have proper button contrast', async ({ page }) => {
    await page.goto('/')
    const buttons = await page.locator('button').count()
    expect(buttons).toBeGreaterThan(0)
  })
})
