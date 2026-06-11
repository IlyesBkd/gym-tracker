import { test, expect, Page, Route } from '@playwright/test'

// ─── Mock DB ─────────────────────────────────────────────────────────────────
const db = {
  workouts: [] as any[],
  bodyweight: [] as any[],
  templates: [] as any[],
  machine: [] as any[],
  notes: [] as any[],
  timer: [] as any[],
}

function reset() {
  db.workouts = []; db.bodyweight = []; db.templates = []
  db.machine = []; db.notes = []; db.timer = []
}

async function mock(page: Page) {
  await page.route('**/api/workouts**', (r: Route) => {
    const m = r.request().method(), u = new URL(r.request().url())
    if (m === 'GET') return r.fulfill({ json: [...db.workouts] })
    if (m === 'POST') {
      const b = r.request().postDataJSON()
      const i = db.workouts.findIndex((w: any) => w.id === b.id)
      i >= 0 ? (db.workouts[i] = b) : db.workouts.unshift(b)
      return r.fulfill({ json: { ok: true } })
    }
    if (m === 'DELETE') {
      db.workouts = db.workouts.filter((w: any) => w.id !== u.searchParams.get('id'))
      return r.fulfill({ json: { ok: true } })
    }
    return r.fulfill({ json: { ok: true } })
  })
  await page.route('**/api/bodyweight**', (r: Route) => {
    const m = r.request().method(), u = new URL(r.request().url())
    if (m === 'GET') return r.fulfill({ json: [...db.bodyweight] })
    if (m === 'POST') {
      const b = r.request().postDataJSON()
      const i = db.bodyweight.findIndex((e: any) => e.id === b.id)
      i >= 0 ? (db.bodyweight[i] = b) : db.bodyweight.push(b)
      return r.fulfill({ json: { ok: true } })
    }
    if (m === 'DELETE') {
      db.bodyweight = db.bodyweight.filter((e: any) => e.id !== u.searchParams.get('id'))
      return r.fulfill({ json: { ok: true } })
    }
    return r.fulfill({ json: { ok: true } })
  })
  await page.route('**/api/templates**', (r: Route) => {
    const m = r.request().method(), u = new URL(r.request().url())
    if (m === 'GET') return r.fulfill({ json: [...db.templates] })
    if (m === 'POST') {
      const b = r.request().postDataJSON()
      const i = db.templates.findIndex((t: any) => t.id === b.id)
      i >= 0 ? (db.templates[i] = b) : db.templates.push(b)
      return r.fulfill({ json: { ok: true } })
    }
    if (m === 'DELETE') {
      db.templates = db.templates.filter((t: any) => t.id !== u.searchParams.get('id'))
      return r.fulfill({ json: { ok: true } })
    }
    return r.fulfill({ json: { ok: true } })
  })
  await page.route('**/api/settings**', (r: Route) => {
    const m = r.request().method(), u = new URL(r.request().url())
    const type = u.searchParams.get('type')
    if (m === 'GET') {
      if (type === 'machine') return r.fulfill({ json: [...db.machine] })
      if (type === 'notes') return r.fulfill({ json: [...db.notes] })
      if (type === 'timer') return r.fulfill({ json: [...db.timer] })
    }
    if (m === 'POST') {
      const b = r.request().postDataJSON()
      if (type === 'machine') { const i = db.machine.findIndex((s:any)=>s.exerciseId===b.exerciseId); i>=0?(db.machine[i]=b):db.machine.push(b) }
      if (type === 'notes') { const i = db.notes.findIndex((n:any)=>n.exerciseId===b.exerciseId); i>=0?(db.notes[i]=b):db.notes.push(b) }
      if (type === 'timer') { const i = db.timer.findIndex((t:any)=>t.exerciseId===b.exerciseId); i>=0?(db.timer[i]=b):db.timer.push(b) }
      return r.fulfill({ json: { ok: true } })
    }
    return r.fulfill({ json: [] })
  })
}

async function load(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
}

async function goNav(page: Page, label: string) {
  await page.locator('nav').last().getByRole('button', { name: label }).click()
}

async function startWorkout(page: Page) {
  await page.locator('nav button.absolute').click()
  await page.getByText('Démarrer une séance').click()
  await expect(page.getByText('Séance en cours')).toBeVisible()
}

async function addExo(page: Page, name: string, muscle?: string) {
  await page.getByText('+ Ajouter un exercice').click()
  if (muscle) await page.locator('.flex.gap-2 button', { hasText: muscle }).first().click()
  await page.getByRole('button', { name: new RegExp(`^${name}`) }).first().click()
  await expect(page.getByText(name, { exact: true })).toBeVisible()
}

async function addSet(page: Page) {
  await page.locator('button', { hasText: '+ Ajouter une série' }).first().click()
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1 · NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('1 · Navigation', () => {
  test.beforeEach(async ({ page }) => { reset(); await mock(page); await load(page) })

  test('1.1 Dashboard affiché au démarrage', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()
  })

  test('1.2 4 onglets bottom nav', async ({ page }) => {
    for (const l of ['Accueil', 'Historique', 'Stats', 'Poids'])
      await expect(page.locator('nav').last().getByText(l)).toBeVisible()
  })

  test('1.3 FAB central visible et cliquable', async ({ page }) => {
    const fab = page.locator('nav button.absolute')
    const box = await fab.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(48)
    await fab.click()
    await expect(page.getByText("Prêt à t'entraîner ?")).toBeVisible()
  })

  test('1.4 nav → Historique', async ({ page }) => {
    await goNav(page, 'Historique')
    await expect(page.getByRole('heading', { name: 'Historique' })).toBeVisible()
  })

  test('1.5 nav → Statistiques', async ({ page }) => {
    await goNav(page, 'Stats')
    await expect(page.getByRole('heading', { name: 'Statistiques' })).toBeVisible()
  })

  test('1.6 nav → Poids corporel', async ({ page }) => {
    await goNav(page, 'Poids')
    await expect(page.getByRole('heading', { name: 'Poids corporel' })).toBeVisible()
  })

  test('1.7 bouton Programmes', async ({ page }) => {
    await page.getByText('Programmes').click()
    await expect(page.getByRole('heading', { name: 'Programmes' })).toBeVisible()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 2 · SÉANCE — workflow complet
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('2 · Séance', () => {
  test.beforeEach(async ({ page }) => {
    reset(); await mock(page); await load(page)
    await page.locator('nav button.absolute').click()
  })

  test('2.1 démarrer séance vide', async ({ page }) => {
    await startWorkout(page)
    await expect(page.getByText('+ Ajouter un exercice')).toBeVisible()
  })

  test('2.2 picker exercices s\'ouvre', async ({ page }) => {
    await startWorkout(page)
    await page.getByText('+ Ajouter un exercice').click()
    await expect(page.getByRole('heading', { name: 'Ajouter un exercice' })).toBeVisible()
  })

  test('2.3 filtre Chest dans picker', async ({ page }) => {
    await startWorkout(page)
    await page.getByText('+ Ajouter un exercice').click()
    await page.getByRole('button', { name: 'Chest', exact: true }).click()
    await expect(page.getByText('Pompes', { exact: true })).toBeVisible()
    await expect(page.getByText('Curl barre', { exact: true })).not.toBeVisible()
  })

  test('2.4 filtre Biceps dans picker', async ({ page }) => {
    await startWorkout(page)
    await page.getByText('+ Ajouter un exercice').click()
    await page.getByRole('button', { name: 'Biceps', exact: true }).click()
    await expect(page.getByText('Curl barre', { exact: true })).toBeVisible()
    await expect(page.getByText('Pompes', { exact: true })).not.toBeVisible()
  })

  test('2.5 filtre Back dans picker', async ({ page }) => {
    await startWorkout(page)
    await page.getByText('+ Ajouter un exercice').click()
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await expect(page.getByText('Tractions', { exact: true })).toBeVisible()
  })

  test('2.6 filtre Tous — affiche tous', async ({ page }) => {
    await startWorkout(page)
    await page.getByText('+ Ajouter un exercice').click()
    await page.getByRole('button', { name: 'Chest', exact: true }).click()
    await page.getByRole('button', { name: 'Tous', exact: true }).click()
    await expect(page.getByText('Pompes', { exact: true })).toBeVisible()
    await expect(page.getByText('Curl barre', { exact: true })).toBeVisible()
  })

  test('2.7 ajouter exercice', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await expect(page.getByText('+ Ajouter une série')).toBeVisible()
  })

  test('2.8 ajouter série — Série 1 visible', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
    await expect(page.locator('button', { hasText: 'Série 1' })).toBeVisible()
  })

  test('2.9 Poids (kg) ET Reps tous deux visibles', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
    await expect(page.getByText('Poids (kg)')).toBeVisible()
    await expect(page.getByText('Reps')).toBeVisible()
    await expect(page.locator('input[inputmode="decimal"]').first()).toBeVisible()
    await expect(page.locator('input[inputmode="numeric"]').first()).toBeVisible()
  })

  test('2.10 stepper poids + → 0 vers 5', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
    const plus = page.locator('.stepper-btn', { hasText: '+' }).first()
    await plus.click(); await plus.click()
    await expect(page.locator('input[inputmode="decimal"]').first()).toHaveValue('5')
  })

  test('2.11 stepper poids − diminue', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
    const plus = page.locator('.stepper-btn', { hasText: '+' }).first()
    await plus.click(); await plus.click(); await plus.click()
    await page.locator('.stepper-btn', { hasText: '−' }).first().click()
    await expect(page.locator('input[inputmode="decimal"]').first()).toHaveValue('5')
  })

  test('2.12 stepper reps + → 8 vers 10', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
    const plus = page.locator('.stepper-btn', { hasText: '+' }).last()
    await plus.click(); await plus.click()
    await expect(page.locator('input[inputmode="numeric"]').first()).toHaveValue('10')
  })

  test('2.13 stepper reps − diminue', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
    await page.locator('.stepper-btn', { hasText: '−' }).last().click()
    await expect(page.locator('input[inputmode="numeric"]').first()).toHaveValue('7')
  })

  test('2.14 saisie manuelle poids sans sauter de curseur', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
    const inp = page.locator('input[inputmode="decimal"]').first()
    await inp.fill('80')
    await inp.blur()
    await expect(inp).toHaveValue('80')
  })

  test('2.15 saisie manuelle reps', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
    const inp = page.locator('input[inputmode="numeric"]').first()
    await inp.fill('15')
    await inp.blur()
    await expect(inp).toHaveValue('15')
  })

  test('2.16 poids et reps indépendants', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
    const wPlus = page.locator('.stepper-btn', { hasText: '+' }).first()
    await wPlus.click(); await wPlus.click()
    await expect(page.locator('input[inputmode="numeric"]').first()).toHaveValue('8')
    await expect(page.locator('input[inputmode="decimal"]').first()).toHaveValue('5')
  })

  test('2.17 toggle warm-up Série1 → Échauf.', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
    await page.locator('button', { hasText: 'Série 1' }).click()
    await expect(page.getByText('Échauf.')).toBeVisible()
  })

  test('2.18 toggle warm-up retour', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
    await page.locator('button', { hasText: 'Série 1' }).click()
    await page.getByText('Échauf.').click()
    await expect(page.locator('button', { hasText: 'Série 1' })).toBeVisible()
  })

  test('2.19 RPE cycle null→6→7', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
    await page.locator('button', { hasText: 'RPE' }).first().click()
    await expect(page.getByText('RPE 6')).toBeVisible()
    await page.locator('button', { hasText: 'RPE' }).first().click()
    await expect(page.getByText('RPE 7')).toBeVisible()
  })

  test('2.20 bouton chrono manuel sur set', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
    // Timer icon button in set header
    const timerBtn = page.locator('.gold-border button').filter({ has: page.locator('svg') }).first()
    await timerBtn.click()
    await page.waitForTimeout(300)
    await expect(page.getByText('passer')).toBeVisible()
  })

  test('2.21 timer auto après ajout série', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
    await page.waitForTimeout(300)
    await expect(page.getByText('passer')).toBeVisible()
  })

  test('2.22 passer le timer', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
    await page.waitForTimeout(300)
    await page.getByText('passer').click()
    await page.waitForTimeout(300)
    await expect(page.getByText('passer')).not.toBeVisible()
  })

  test('2.23 supprimer une série', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
    await page.locator('button', { hasText: '×' }).last().click()
    await expect(page.locator('button', { hasText: 'Série 1' })).not.toBeVisible()
  })

  test('2.24 3 séries numérotées', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page); await addSet(page); await addSet(page)
    await expect(page.locator('button', { hasText: 'Série 3' })).toBeVisible()
  })

  test('2.25 warm-up non compté (1 working set)', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
    await page.locator('button', { hasText: 'Série 1' }).click() // make warmup
    await addSet(page)
    // New set should be Série 1 (not Série 2)
    const series = page.locator('button', { hasText: 'Série 1' })
    await expect(series).toBeVisible()
  })

  test('2.26 supprimer exercice', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await page.locator('button', { hasText: '✕' }).first().click()
    await expect(page.getByText('Pompes', { exact: true })).not.toBeVisible()
  })

  test('2.27 ajouter 2 exercices différents', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addExo(page, 'Curl barre', 'Biceps')
    await expect(page.getByText('Pompes', { exact: true })).toBeVisible()
    await expect(page.getByText('Curl barre', { exact: true })).toBeVisible()
  })

  test('2.28 réordonner exercices ▼ actif', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addExo(page, 'Curl barre', 'Biceps')
    const down = page.locator('button', { hasText: '▼' }).first()
    await expect(down).not.toBeDisabled()
    await down.click()
    await expect(page.getByText('Pompes', { exact: true })).toBeVisible()
  })

  test('2.29 terminer séance → écran accueil séance', async ({ page }) => {
    await startWorkout(page)
    await page.getByText('Terminer').click()
    await expect(page.getByText("Prêt à t'entraîner ?")).toBeVisible()
  })

  test('2.30 après Terminer l\'écran ne reste pas vide', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
    await page.getByText('Terminer').click()
    // Should show start screen, NOT loading spinner or blank
    await expect(page.getByText("Prêt à t'entraîner ?")).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.animate-spin')).not.toBeVisible()
  })

  test('2.31 timer de repos persiste en naviguant', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
    await page.waitForTimeout(300)
    await expect(page.getByText('passer')).toBeVisible()
    // Navigate away and back
    await goNav(page, 'Historique')
    await expect(page.getByText('passer')).toBeVisible()
    await page.locator('nav button.absolute').click()
    await expect(page.getByText('passer')).toBeVisible()
  })

  test('2.32 bouton retour picker', async ({ page }) => {
    await startWorkout(page)
    await page.getByText('+ Ajouter un exercice').click()
    await page.locator('button', { hasText: '←' }).click()
    await expect(page.getByText('Séance en cours')).toBeVisible()
  })

  test('2.33 timer personnalisé sauvegardé', async ({ page }) => {
    await startWorkout(page)
    await addExo(page, 'Pompes')
    // Open timer edit
    await page.locator('button').filter({ hasText: /\d+s/ }).first().click()
    const input = page.locator('input[inputmode="numeric"]').first()
    await input.fill('90')
    await page.locator('button', { hasText: 'OK' }).first().click()
    await expect(page.getByText('90s')).toBeVisible()
    // Check timer setting was saved
    expect(db.timer.length).toBe(1)
    expect(db.timer[0].restSeconds).toBe(90)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 3 · POIDS CORPOREL
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('3 · Poids corporel', () => {
  test.beforeEach(async ({ page }) => {
    reset(); await mock(page); await load(page)
    await goNav(page, 'Poids')
    await expect(page.getByRole('heading', { name: 'Poids corporel' })).toBeVisible()
  })

  test('3.1 input visible', async ({ page }) => {
    await expect(page.getByPlaceholder('Poids (kg)')).toBeVisible()
  })

  test('3.2 ajouter entrée — apparaît immédiatement (optimistic)', async ({ page }) => {
    await page.getByPlaceholder('Poids (kg)').fill('75.5')
    await page.locator('button', { hasText: '+' }).click()
    await expect(page.getByText('75.5 kg')).toBeVisible({ timeout: 1000 })
  })

  test('3.3 input vidé après ajout', async ({ page }) => {
    await page.getByPlaceholder('Poids (kg)').fill('80')
    await page.locator('button', { hasText: '+' }).click()
    await expect(page.getByPlaceholder('Poids (kg)')).toHaveValue('')
  })

  test('3.4 moyennes 7j/30j après plusieurs entrées', async ({ page }) => {
    for (const w of ['74', '75', '76']) {
      await page.getByPlaceholder('Poids (kg)').fill(w)
      await page.locator('button', { hasText: '+' }).click()
    }
    await expect(page.getByText('Moy. 7j')).toBeVisible()
    await expect(page.getByText('Moy. 30j')).toBeVisible()
  })

  test('3.5 modifier une entrée', async ({ page }) => {
    await page.getByPlaceholder('Poids (kg)').fill('70')
    await page.locator('button', { hasText: '+' }).click()
    await expect(page.getByText('70 kg')).toBeVisible()
    await page.locator('button', { hasText: '✎' }).first().click()
    // In edit mode, fill the edit input specifically
    await page.locator('.divide-y input[type="number"]').fill('71')
    await page.locator('button', { hasText: '✓' }).click()
    await expect(page.getByText('71 kg')).toBeVisible()
  })

  test('3.6 supprimer une entrée', async ({ page }) => {
    await page.getByPlaceholder('Poids (kg)').fill('72')
    await page.locator('button', { hasText: '+' }).click()
    await expect(page.getByText('72 kg')).toBeVisible()
    await page.locator('button', { hasText: '🗑' }).first().click()
    await page.waitForTimeout(300)
    await expect(page.getByText('72 kg')).not.toBeVisible()
  })

  test('3.7 graphe visible après 2+ entrées', async ({ page }) => {
    for (const w of ['70', '71']) {
      await page.getByPlaceholder('Poids (kg)').fill(w)
      await page.locator('button', { hasText: '+' }).click()
    }
    await expect(page.getByText('Évolution')).toBeVisible()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 4 · HISTORIQUE
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('4 · Historique', () => {
  test.beforeEach(async ({ page }) => {
    reset()
    db.workouts = [{
      id: 'w1', startTime: Date.now() - 7200000, endTime: Date.now() - 3600000,
      exercises: [{
        exerciseId: 'push-ups',
        sets: [
          { id: 's1', weight: 0, reps: 20, timestamp: Date.now() },
          { id: 's2', weight: 0, reps: 18, timestamp: Date.now() },
        ]
      }]
    }]
    await mock(page); await load(page)
    await goNav(page, 'Historique')
    await expect(page.getByRole('heading', { name: 'Historique' })).toBeVisible()
  })

  test('4.1 workout affiché avec nom exercice', async ({ page }) => {
    await expect(page.getByText('Pompes', { exact: true })).toBeVisible()
  })

  test('4.2 compte séries correct', async ({ page }) => {
    await expect(page.getByText('2 séries')).toBeVisible()
  })

  test('4.3 durée affichée', async ({ page }) => {
    await expect(page.getByText(/\d+h|\d+m/)).toBeVisible()
  })

  test('4.4 supprimer workout', async ({ page }) => {
    await page.locator('button', { hasText: '🗑' }).first().click()
    await page.waitForTimeout(500)
    await expect(page.getByText('Pompes', { exact: true })).not.toBeVisible()
    await expect(page.getByText('Aucune séance')).toBeVisible()
  })

  test('4.5 clic exercice → détail', async ({ page }) => {
    await page.getByText('Pompes', { exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Pompes' })).toBeVisible()
    await expect(page.getByText('Poids max')).toBeVisible()
  })

  test('4.6 état vide avec titre', async ({ page }) => {
    db.workouts = []
    await page.reload(); await page.waitForLoadState('networkidle')
    await goNav(page, 'Historique')
    await expect(page.getByRole('heading', { name: 'Historique' })).toBeVisible()
    await expect(page.getByText('Aucune séance')).toBeVisible()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 5 · DÉTAIL EXERCICE
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('5 · Détail exercice', () => {
  test.beforeEach(async ({ page }) => {
    reset()
    db.workouts = [
      {
        id: 'e1', startTime: Date.now() - 86400000, endTime: Date.now() - 82800000,
        exercises: [{ exerciseId: 'push-ups', sets: [
          { id: 's1', weight: 0, reps: 25, timestamp: Date.now() },
          { id: 's2', weight: 0, reps: 20, timestamp: Date.now() },
        ]}]
      },
      {
        id: 'e2', startTime: Date.now() - 172800000, endTime: Date.now() - 169200000,
        exercises: [{ exerciseId: 'push-ups', sets: [
          { id: 's3', weight: 0, reps: 22, timestamp: Date.now() },
        ]}]
      }
    ]
    await mock(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await goNav(page, 'Historique')
    // Two workouts both have Pompes — click the first occurrence
    await page.getByRole('button', { name: /Pompes/ }).first().click()
    await expect(page.getByRole('heading', { name: 'Pompes' })).toBeVisible()
  })

  test('5.1 records poids/reps/volume affichés', async ({ page }) => {
    for (const t of ['Poids max', 'Reps max', 'Vol max'])
      await expect(page.getByText(t)).toBeVisible()
  })

  test('5.2 max reps = 25', async ({ page }) => {
    await expect(page.getByText('25', { exact: true })).toBeVisible()
  })

  test('5.3 graphe progression', async ({ page }) => {
    await expect(page.getByText('Progression')).toBeVisible()
  })

  test('5.4 historique séances', async ({ page }) => {
    await expect(page.getByText(/0kg × 25/)).toBeVisible()
  })

  test('5.5 ouvrir réglages & notes', async ({ page }) => {
    await page.locator('button').filter({ hasText: /▼|▲/ }).first().click()
    await expect(page.getByPlaceholder(/Siège position/)).toBeVisible({ timeout: 3000 })
  })

  test('5.6 retour vers historique', async ({ page }) => {
    await page.locator('button', { hasText: '←' }).click()
    await expect(page.getByRole('heading', { name: 'Historique' })).toBeVisible()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 6 · STATISTIQUES
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('6 · Statistiques', () => {
  test.beforeEach(async ({ page }) => {
    reset()
    db.workouts = [
      {
        id: 'st1', startTime: Date.now() - 86400000, endTime: Date.now() - 82800000,
        exercises: [
          { exerciseId: 'push-ups', sets: [{ id: 's1', weight: 50, reps: 10, timestamp: Date.now() }] },
          { exerciseId: 'barbell-curl', sets: [{ id: 's2', weight: 30, reps: 12, timestamp: Date.now() }] },
        ]
      },
      {
        id: 'st2', startTime: Date.now() - 7 * 86400000, endTime: Date.now() - 7 * 86400000 + 3600000,
        exercises: [{ exerciseId: 'pull-ups', sets: [{ id: 's3', weight: 0, reps: 8, timestamp: Date.now() }] }]
      }
    ]
    await mock(page); await load(page)
    await goNav(page, 'Stats')
    await expect(page.getByRole('heading', { name: 'Statistiques' })).toBeVisible()
  })

  test('6.1 total séances = 2', async ({ page }) => {
    await expect(page.getByText('Total séances')).toBeVisible()
    await expect(page.getByText('2', { exact: true })).toBeVisible()
  })

  test('6.2 durée moy affiché', async ({ page }) => {
    await expect(page.getByText('Durée moy.')).toBeVisible()
  })

  test('6.3 semaine vs précédente', async ({ page }) => {
    await expect(page.getByText('Semaine vs. précédente')).toBeVisible()
    await expect(page.locator('p', { hasText: /Cette semaine|cette semaine/ }).first()).toBeVisible()
  })

  test('6.4 séries totales par muscle', async ({ page }) => {
    await expect(page.getByText('Séries totales par muscle')).toBeVisible()
  })

  test('6.5 plus entraîné', async ({ page }) => {
    await expect(page.getByText('Plus entraîné')).toBeVisible()
  })

  test('6.6 plus longue', async ({ page }) => {
    await expect(page.getByText('Plus longue')).toBeVisible()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 7 · DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('7 · Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    reset()
    db.workouts = [{
      id: 'dash1', startTime: Date.now() - 3600000, endTime: Date.now() - 100,
      exercises: [{ exerciseId: 'push-ups', sets: [{ id: 's1', weight: 0, reps: 20, timestamp: Date.now() }] }]
    }]
    await mock(page); await load(page)
    await page.waitForTimeout(600)
  })

  test('7.1 dernière séance', async ({ page }) => {
    await expect(page.getByText('Dernière séance')).toBeVisible({ timeout: 8000 })
  })

  test('7.2 cette semaine / ce mois', async ({ page }) => {
    await expect(page.getByText('Cette semaine')).toBeVisible()
    await expect(page.getByText('Ce mois')).toBeVisible()
  })

  test('7.3 calendrier 12 semaines', async ({ page }) => {
    await expect(page.getByText('Activité (12 semaines)')).toBeVisible()
  })

  test('7.4 alertes fréquence musculaire', async ({ page }) => {
    await expect(page.getByText('Fréquence musculaire (7j)')).toBeVisible()
    await expect(page.getByText('EN RETARD').first()).toBeVisible()
  })

  test('7.5 volume hebdo par muscle', async ({ page }) => {
    await expect(page.getByText('Volume hebdo par muscle')).toBeVisible()
  })

  test('7.6 temps total et volume total', async ({ page }) => {
    await expect(page.getByText('Temps total')).toBeVisible()
    await expect(page.getByText('Volume total')).toBeVisible()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 8 · PROGRAMMES (TEMPLATES)
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('8 · Programmes', () => {
  test.beforeEach(async ({ page }) => {
    reset()
    // Don't load yet — individual tests may set db.templates before loading
  })

  test('8.1 état vide', async ({ page }) => {
    await mock(page); await page.goto('/'); await page.waitForLoadState('networkidle')
    await page.getByText('Programmes').click()
    await expect(page.getByText('Aucun programme')).toBeVisible()
    await expect(page.getByText('Crée-en un pour démarrer en 1 tap')).toBeVisible()
  })

  test('8.2 ouvrir éditeur', async ({ page }) => {
    await mock(page); await page.goto('/'); await page.waitForLoadState('networkidle')
    await page.getByText('Programmes').click()
    await page.getByText('+ Nouveau').click()
    await expect(page.getByPlaceholder('Nom du programme')).toBeVisible()
  })

  test('8.3 créer programme', async ({ page }) => {
    await mock(page); await page.goto('/'); await page.waitForLoadState('networkidle')
    await page.getByText('Programmes').click()
    await page.getByText('+ Nouveau').click()
    await page.getByPlaceholder('Nom du programme').fill('Push Day')
    await page.locator('button').filter({ hasText: '+ Exercice' }).first().click()
    await page.getByText('Pompes', { exact: true }).first().click()
    await page.locator('button', { hasText: 'Enregistrer' }).click()
    await expect(page.getByText('Push Day')).toBeVisible()
  })

  test('8.4 template → bouton Démarrer', async ({ page }) => {
    db.templates = [{ id: 't1', name: 'Pull Day', exerciseIds: ['pull-ups'], supersets: [], createdAt: Date.now() }]
    await mock(page); await page.goto('/'); await page.waitForLoadState('networkidle')
    await page.getByText('Programmes').click()
    await expect(page.getByText('Pull Day')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('button', { hasText: 'Démarrer' })).toBeVisible()
  })

  test('8.5 lancer depuis template', async ({ page }) => {
    db.templates = [{ id: 't2', name: 'Chest', exerciseIds: ['push-ups'], supersets: [], createdAt: Date.now() }]
    await mock(page); await page.goto('/'); await page.waitForLoadState('networkidle')
    await page.getByText('Programmes').click()
    await page.locator('button', { hasText: 'Démarrer' }).click()
    await expect(page.getByText('Séance en cours')).toBeVisible()
    await expect(page.getByText('Pompes', { exact: true })).toBeVisible()
  })

  test('8.6 supprimer template', async ({ page }) => {
    db.templates = [{ id: 't3', name: 'Leg Day', exerciseIds: ['pull-ups'], supersets: [], createdAt: Date.now() }]
    await mock(page); await page.goto('/'); await page.waitForLoadState('networkidle')
    await page.getByText('Programmes').click()
    await expect(page.getByText('Leg Day')).toBeVisible({ timeout: 5000 })
    await page.locator('button', { hasText: '🗑' }).first().click()
    await page.waitForTimeout(500)
    await expect(page.getByText('Leg Day')).not.toBeVisible()
  })

  test('8.7 éditer template', async ({ page }) => {
    db.templates = [{ id: 't4', name: 'Old Name', exerciseIds: ['push-ups'], supersets: [], createdAt: Date.now() }]
    await mock(page); await page.goto('/'); await page.waitForLoadState('networkidle')
    await page.getByText('Programmes').click()
    await expect(page.getByText('Old Name')).toBeVisible({ timeout: 5000 })
    await page.locator('button', { hasText: '✎' }).first().click()
    await expect(page.getByText('Modifier le programme')).toBeVisible()
    await expect(page.getByPlaceholder('Nom du programme')).toHaveValue('Old Name')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 9 · SURCHARGE PROGRESSIVE
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('9 · Surcharge progressive', () => {
  test.beforeEach(async ({ page }) => {
    reset()
    db.workouts = [
      {
        id: 'p1', startTime: Date.now() - 3 * 86400000, endTime: Date.now() - 3 * 86400000 + 3600000,
        exercises: [{ exerciseId: 'barbell-curl', sets: [
          { id: 'a1', weight: 30, reps: 12, timestamp: Date.now() },
          { id: 'a2', weight: 30, reps: 12, timestamp: Date.now() },
          { id: 'a3', weight: 30, reps: 12, timestamp: Date.now() },
        ]}]
      },
      {
        id: 'p2', startTime: Date.now() - 6 * 86400000, endTime: Date.now() - 6 * 86400000 + 3600000,
        exercises: [{ exerciseId: 'barbell-curl', sets: [
          { id: 'a4', weight: 28, reps: 12, timestamp: Date.now() },
          { id: 'a5', weight: 28, reps: 12, timestamp: Date.now() },
        ]}]
      },
      {
        id: 'p3', startTime: Date.now() - 9 * 86400000, endTime: Date.now() - 9 * 86400000 + 3600000,
        exercises: [{ exerciseId: 'barbell-curl', sets: [
          { id: 'a6', weight: 26, reps: 12, timestamp: Date.now() },
        ]}]
      }
    ]
    await mock(page); await load(page)
    await page.locator('nav button.absolute').click()
    await startWorkout(page)
    await addExo(page, 'Curl barre', 'Biceps')
  })

  test('9.1 recommandation affichée', async ({ page }) => {
    await expect(page.getByText(/Passe à|vise|Tous les sets/).first()).toBeVisible({ timeout: 5000 })
  })

  test('9.2 badge tendance ↗/→/↘', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: /^↗$|^→$|^↘$/ }).first()).toBeVisible({ timeout: 5000 })
  })

  test('9.3 sets précédents pré-remplis', async ({ page }) => {
    await expect(page.getByText('Précédent')).toBeVisible()
    await expect(page.getByText(/30×12|30kg/).first()).toBeVisible()
  })

  test('9.4 mini graphe progression visible', async ({ page }) => {
    // The chart renders only when progressionChart.length >= 3 (3 sessions needed)
    // Our mock now has 3 sessions → the h-9 chart container should appear
    await page.waitForTimeout(500)
    await expect(page.locator('.glass.rounded-3xl').first().locator('.h-9')).toBeVisible({ timeout: 5000 })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 10 · ROBUSTESSE & ERREURS
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('10 · Robustesse', () => {
  test('10.1 API 500 — app ne crashe pas', async ({ page }) => {
    await page.route('**/api/workouts**', r => r.fulfill({ status: 500, json: { error: 'fail' } }))
    await page.route('**/api/bodyweight**', r => r.fulfill({ json: [] }))
    await page.route('**/api/templates**', r => r.fulfill({ json: [] }))
    await page.route('**/api/settings**', r => r.fulfill({ json: [] }))
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()
  })

  test('10.2 aucune erreur JS', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    reset(); await mock(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    expect(errors).toHaveLength(0)
  })

  test('10.3 bannière offline si hors ligne', async ({ page }) => {
    reset(); await mock(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      window.dispatchEvent(new Event('offline'))
    })
    await page.waitForTimeout(300)
    await expect(page.getByText('Hors ligne')).toBeVisible()
  })

  test('10.4 save error banner si API fail pendant séance', async ({ page }) => {
    reset(); await mock(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await page.locator('nav button.absolute').click()
    await startWorkout(page)
    await page.route('**/api/workouts**', r => {
      if (r.request().method() === 'POST') return r.fulfill({ status: 500 })
      return r.fulfill({ json: [] })
    })
    await page.getByText('+ Ajouter un exercice').click()
    await page.getByText('Pompes', { exact: true }).first().click()
    await page.waitForTimeout(600)
    await expect(page.getByText('Erreur de sauvegarde')).toBeVisible({ timeout: 5000 })
  })

  test('10.5 DB vide — tous les écrans s\'affichent', async ({ page }) => {
    reset(); await mock(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()
    await goNav(page, 'Historique')
    await expect(page.getByText('Aucune séance')).toBeVisible()
    await goNav(page, 'Stats')
    await expect(page.getByRole('heading', { name: 'Statistiques' })).toBeVisible()
    await goNav(page, 'Poids')
    await expect(page.getByRole('heading', { name: 'Poids corporel' })).toBeVisible()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 11 · UX MOBILE
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('11 · UX Mobile', () => {
  test.beforeEach(async ({ page }) => {
    reset(); await mock(page); await load(page)
    await page.locator('nav button.absolute').click()
    await startWorkout(page)
    await addExo(page, 'Pompes')
    await addSet(page)
  })

  test('11.1 steppers ≥ 44px de hauteur', async ({ page }) => {
    const steppers = page.locator('.stepper-btn')
    const count = await steppers.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      const box = await steppers.nth(i).boundingBox()
      if (box) expect(box.height, `Stepper ${i}: ${box.height}px`).toBeGreaterThanOrEqual(44)
    }
  })

  test('11.2 inputs ≥ 44px', async ({ page }) => {
    const inputs = page.locator('input[type="number"]')
    const count = await inputs.count()
    for (let i = 0; i < count; i++) {
      const box = await inputs.nth(i).boundingBox()
      if (box) expect(box.height).toBeGreaterThanOrEqual(44)
    }
  })

  test('11.3 FAB ≥ 48px', async ({ page }) => {
    await load(page)
    const fab = page.locator('nav button.absolute')
    const box = await fab.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(48)
    expect(box!.height).toBeGreaterThanOrEqual(48)
  })

  test('11.4 viewport 390px', async ({ page }) => {
    expect(page.viewportSize()?.width).toBe(390)
  })

  test('11.5 pas de scroll horizontal', async ({ page }) => {
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2)
  })
})
