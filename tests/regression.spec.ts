import { test, expect, Page, Route } from '@playwright/test'

// ─── Mock store ──────────────────────────────────────────────────────────────
const db = { workouts: [] as any[], bodyweight: [] as any[], templates: [] as any[], machineSettings: [] as any[], exerciseNotes: [] as any[], timerSettings: [] as any[] }

function reset() {
  db.workouts = []; db.bodyweight = []; db.templates = []
  db.machineSettings = []; db.exerciseNotes = []; db.timerSettings = []
}

async function mock(page: Page) {
  await page.route('**/api/workouts**', (r: Route) => {
    const m = r.request().method(), u = new URL(r.request().url())
    if (m === 'GET') return r.fulfill({ json: [...db.workouts] })
    if (m === 'POST') { const b = r.request().postDataJSON(); const i = db.workouts.findIndex((w:any)=>w.id===b.id); i>=0?db.workouts[i]=b:db.workouts.unshift(b); return r.fulfill({ json: { ok: true } }) }
    if (m === 'DELETE') { db.workouts = db.workouts.filter((w:any)=>w.id!==u.searchParams.get('id')); return r.fulfill({ json: { ok: true } }) }
    return r.fulfill({ json: { ok: true } })
  })
  await page.route('**/api/bodyweight**', (r: Route) => {
    const m = r.request().method(), u = new URL(r.request().url())
    if (m === 'GET') return r.fulfill({ json: [...db.bodyweight] })
    if (m === 'POST') { const b = r.request().postDataJSON(); const i = db.bodyweight.findIndex((e:any)=>e.id===b.id); i>=0?db.bodyweight[i]=b:db.bodyweight.push(b); return r.fulfill({ json: { ok: true } }) }
    if (m === 'DELETE') { db.bodyweight = db.bodyweight.filter((e:any)=>e.id!==u.searchParams.get('id')); return r.fulfill({ json: { ok: true } }) }
    return r.fulfill({ json: { ok: true } })
  })
  await page.route('**/api/templates**', (r: Route) => { return r.fulfill({ json: [] }) })
  await page.route('**/api/settings**', (r: Route) => { return r.fulfill({ json: [] }) })
}

// ─── BUG 1: SetRow — reps visibles et modifiables ────────────────────────────
test.describe('BUG-1 SetRow: reps toujours visibles', () => {
  test.beforeEach(async ({ page }) => {
    reset(); await mock(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    // Start workout
    await page.locator('nav button.absolute').click()
    await page.getByText('Démarrer une séance').click()
    await page.getByText('+ Ajouter un exercice').click()
    await page.getByText('Développé couché assisté').first().click()
    await page.locator('button', { hasText: '+ Ajouter une série' }).first().click()
  })

  test('le label "Reps" est visible', async ({ page }) => {
    await expect(page.getByText('Reps')).toBeVisible()
  })

  test('l\'input reps est visible', async ({ page }) => {
    await expect(page.locator('input[inputmode="numeric"]').first()).toBeVisible()
  })

  test('stepper + reps augmente la valeur', async ({ page }) => {
    const plus = page.locator('.stepper-btn', { hasText: '+' }).last()
    await plus.click()
    await plus.click()
    await expect(page.locator('input[inputmode="numeric"]').first()).toHaveValue('10')
  })

  test('stepper − reps diminue la valeur', async ({ page }) => {
    await page.locator('.stepper-btn', { hasText: '−' }).last().click()
    await expect(page.locator('input[inputmode="numeric"]').first()).toHaveValue('7')
  })

  test('input reps modifiable manuellement', async ({ page }) => {
    const inp = page.locator('input[inputmode="numeric"]').first()
    await inp.fill('15')
    await inp.blur()
    await expect(inp).toHaveValue('15')
  })

  test('les sets ne disparaissent pas après tap sur le header', async ({ page }) => {
    // Tap the exercise card header
    await page.locator('.glass.rounded-3xl').first().locator('div').first().click()
    // Reps should still be visible (card is not collapsible)
    await expect(page.locator('input[inputmode="numeric"]').first()).toBeVisible()
    await expect(page.getByText('Reps')).toBeVisible()
  })

  test('plusieurs séries affichent toutes les reps', async ({ page }) => {
    await page.locator('button', { hasText: '+ Ajouter une série' }).first().click()
    await page.locator('button', { hasText: '+ Ajouter une série' }).first().click()
    const inputs = page.locator('input[inputmode="numeric"]')
    expect(await inputs.count()).toBe(3)
  })

  test('poids et reps indépendants (modifier poids ne change pas reps)', async ({ page }) => {
    const wPlus = page.locator('.stepper-btn', { hasText: '+' }).first()
    await wPlus.click(); await wPlus.click() // weight 0→5
    // Reps should still be 8
    await expect(page.locator('input[inputmode="numeric"]').first()).toHaveValue('8')
    await expect(page.locator('input[inputmode="decimal"]').first()).toHaveValue('5')
  })
})

// ─── BUG 2: API error — vérifier que l'erreur vient bien de DATABASE_URL ─────
test.describe('BUG-2 API: gestion d\'erreur réseau', () => {
  test('bannière offline affichée si navigator.onLine=false', async ({ page }) => {
    reset(); await mock(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Simulate going offline
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      window.dispatchEvent(new Event('offline'))
    })
    await page.waitForTimeout(300)
    await expect(page.getByText('Hors ligne')).toBeVisible()
  })

  test('app fonctionne quand API répond correctement', async ({ page }) => {
    reset(); await mock(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()
    // No error banner
    await expect(page.getByText('Impossible de charger')).not.toBeVisible()
    await expect(page.getByText('Erreur de sauvegarde')).not.toBeVisible()
  })

  test('bannière erreur save si API échoue pendant séance', async ({ page }) => {
    reset(); await mock(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await page.locator('nav button.absolute').click()
    await page.getByText('Démarrer une séance').click()
    // Now make workouts POST fail
    await page.route('**/api/workouts**', r => {
      if (r.request().method() === 'POST') return r.fulfill({ status: 500, json: { error: 'db error' } })
      return r.fulfill({ json: [] })
    })
    await page.getByText('+ Ajouter un exercice').click()
    await page.getByText('Pompes', { exact: true }).first().click()
    await page.waitForTimeout(500)
    await expect(page.getByText('Erreur de sauvegarde')).toBeVisible({ timeout: 5000 })
  })

  test('aucune erreur avec API mock qui marche', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    reset(); await mock(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    expect(errors).toHaveLength(0)
  })
})

// ─── Regression: séance complète poids + reps ─────────────────────────────────
test.describe('REGRESSION: séance complète', () => {
  test('workflow complet: ajout exo → 3 sets → poids + reps → terminer', async ({ page }) => {
    reset(); await mock(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')

    // Start
    await page.locator('nav button.absolute').click()
    await page.getByText('Démarrer une séance').click()

    // Add exercise
    await page.getByText('+ Ajouter un exercice').click()
    await page.locator('div.flex.gap-2 button', { hasText: 'Chest' }).first().click()
    await page.getByText('Développé couché assisté').first().click()

    // Add 3 sets
    for (let i = 0; i < 3; i++) {
      await page.locator('button', { hasText: '+ Ajouter une série' }).first().click()
    }
    await expect(page.locator('button', { hasText: 'Série 3' })).toBeVisible()

    // Set weight on set 1: 60kg (0 + 24 × 2.5)
    const wPlus = page.locator('.stepper-btn', { hasText: '+' }).first()
    for (let i = 0; i < 24; i++) await wPlus.click()
    await expect(page.locator('input[inputmode="decimal"]').first()).toHaveValue('60')

    // Set reps on set 1: 10
    const rPlus = page.locator('.stepper-btn', { hasText: '+' }).nth(1)
    await rPlus.click(); await rPlus.click()
    await expect(page.locator('input[inputmode="numeric"]').first()).toHaveValue('10')

    // Finish
    await page.getByText('Terminer').click()
    await expect(page.getByText("Prêt à t'entraîner ?")).toBeVisible()

    // Check that session resets correctly (workout saved in mock db)
    await expect(page.getByText("Prêt à t'entraîner ?")).toBeVisible()
    // Verify mock saved the workout
    expect(db.workouts.length).toBe(1)
    expect(db.workouts[0].exercises[0].sets.length).toBe(3)
  })
})
