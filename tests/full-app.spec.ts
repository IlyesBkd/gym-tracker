import { test, expect, Page, Route } from '@playwright/test'

// ─── Mock store ──────────────────────────────────────────────────────────────
const db = {
  workouts: [] as any[],
  bodyweight: [] as any[],
  templates: [] as any[],
  machineSettings: [] as any[],
  exerciseNotes: [] as any[],
  timerSettings: [] as any[],
}

function resetDB() {
  db.workouts = []
  db.bodyweight = []
  db.templates = []
  db.machineSettings = []
  db.exerciseNotes = []
  db.timerSettings = []
}

async function mockAPIs(page: Page) {
  await page.route('**/api/workouts**', (r: Route) => {
    const m = r.request().method()
    const u = new URL(r.request().url())
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
    const m = r.request().method()
    const u = new URL(r.request().url())
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
    const m = r.request().method()
    const u = new URL(r.request().url())
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
    const m = r.request().method()
    const u = new URL(r.request().url())
    const type = u.searchParams.get('type')
    if (m === 'GET') {
      if (type === 'machine') return r.fulfill({ json: [...db.machineSettings] })
      if (type === 'notes') return r.fulfill({ json: [...db.exerciseNotes] })
      if (type === 'timer') return r.fulfill({ json: [...db.timerSettings] })
    }
    if (m === 'POST') {
      const b = r.request().postDataJSON()
      if (type === 'machine') {
        const i = db.machineSettings.findIndex((s: any) => s.exerciseId === b.exerciseId)
        i >= 0 ? (db.machineSettings[i] = b) : db.machineSettings.push(b)
      } else if (type === 'notes') {
        const i = db.exerciseNotes.findIndex((n: any) => n.exerciseId === b.exerciseId)
        i >= 0 ? (db.exerciseNotes[i] = b) : db.exerciseNotes.push(b)
      } else if (type === 'timer') {
        const i = db.timerSettings.findIndex((t: any) => t.exerciseId === b.exerciseId)
        i >= 0 ? (db.timerSettings[i] = b) : db.timerSettings.push(b)
      }
      return r.fulfill({ json: { ok: true } })
    }
    return r.fulfill({ json: [] })
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function goTo(page: Page, tab: 'Historique' | 'Stats' | 'Poids') {
  await page.locator('nav').last().getByRole('button', { name: tab }).click()
}

async function startWorkout(page: Page) {
  await page.locator('nav button.absolute').click()
  await page.getByText('Démarrer une séance').click()
  await expect(page.getByText('Séance en cours')).toBeVisible()
}

async function addExercise(page: Page, name: string, muscle?: string) {
  await page.getByText('+ Ajouter un exercice').click()
  if (muscle) {
    await page.locator('.flex.gap-2 button', { hasText: muscle }).first().click()
  }
  await page.getByRole('button', { name: new RegExp(`^${name}`) }).first().click()
  await expect(page.getByText(name, { exact: true })).toBeVisible()
}

async function addSet(page: Page) {
  await page.locator('button', { hasText: '+ Ajouter une série' }).first().click()
}

// ─── 1. Navigation ────────────────────────────────────────────────────────────
test.describe('1. Navigation', () => {
  test.beforeEach(async ({ page }) => {
    resetDB(); await mockAPIs(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
  })

  test('1.1 chargement initial — dashboard visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()
  })

  test('1.2 bottom nav — 4 onglets visibles', async ({ page }) => {
    const nav = page.locator('nav').last()
    for (const label of ['Accueil', 'Historique', 'Stats', 'Poids']) {
      await expect(nav.getByText(label)).toBeVisible()
    }
  })

  test('1.3 navigation → Historique', async ({ page }) => {
    await goTo(page, 'Historique')
    await expect(page.getByRole('heading', { name: 'Historique' })).toBeVisible()
    await expect(page.getByText('Aucune séance')).toBeVisible()
  })

  test('1.4 navigation → Statistiques', async ({ page }) => {
    await goTo(page, 'Stats')
    await expect(page.getByRole('heading', { name: 'Statistiques' })).toBeVisible()
  })

  test('1.5 navigation → Poids corporel', async ({ page }) => {
    await goTo(page, 'Poids')
    await expect(page.getByRole('heading', { name: 'Poids corporel' })).toBeVisible()
  })

  test('1.6 FAB central → écran séance', async ({ page }) => {
    await page.locator('nav button.absolute').click()
    await expect(page.getByText("Prêt à t'entraîner ?")).toBeVisible()
  })

  test('1.7 bouton Programmes → liste templates', async ({ page }) => {
    await page.getByText('Programmes').click()
    await expect(page.getByRole('heading', { name: 'Programmes' })).toBeVisible()
  })
})

// ─── 2. Séance ───────────────────────────────────────────────────────────────
test.describe('2. Séance', () => {
  test.beforeEach(async ({ page }) => {
    resetDB(); await mockAPIs(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await page.locator('nav button.absolute').click()
  })

  test('2.1 démarrer une séance vide', async ({ page }) => {
    await startWorkout(page)
    await expect(page.getByText('+ Ajouter un exercice')).toBeVisible()
    await expect(page.getByText('Terminer')).toBeVisible()
  })

  test('2.2 ouvrir le picker d\'exercices', async ({ page }) => {
    await startWorkout(page)
    await page.getByText('+ Ajouter un exercice').click()
    await expect(page.getByRole('heading', { name: 'Ajouter un exercice' })).toBeVisible()
    await expect(page.getByText('Pompes', { exact: true })).toBeVisible()
  })

  test('2.3 chips de filtre musculaire visibles', async ({ page }) => {
    await startWorkout(page)
    await page.getByText('+ Ajouter un exercice').click()
    for (const chip of ['Tous', 'Chest', 'Back', 'Biceps', 'Triceps', 'Abs']) {
      await expect(page.getByRole('button', { name: chip, exact: true })).toBeVisible()
    }
  })

  test('2.4 filtre Biceps — affiche seulement les curls', async ({ page }) => {
    await startWorkout(page)
    await page.getByText('+ Ajouter un exercice').click()
    await page.getByRole('button', { name: 'Biceps', exact: true }).click()
    await expect(page.getByText('Curl barre', { exact: true })).toBeVisible()
    await expect(page.getByText('Pompes', { exact: true })).not.toBeVisible()
  })

  test('2.5 ajouter un exercice', async ({ page }) => {
    await startWorkout(page)
    await addExercise(page, 'Pompes')
    await expect(page.getByText('+ Ajouter une série')).toBeVisible()
  })

  test('2.6 ajouter une série', async ({ page }) => {
    await startWorkout(page)
    await addExercise(page, 'Pompes')
    await addSet(page)
    await expect(page.locator('button', { hasText: 'Série 1' })).toBeVisible()
  })

  test('2.7 stepper + augmente le poids de 2.5kg', async ({ page }) => {
    await startWorkout(page)
    await addExercise(page, 'Pompes')
    await addSet(page)
    const wPlus = page.locator('.stepper-btn', { hasText: '+' }).first()
    await wPlus.click(); await wPlus.click() // 0 → 5
    await expect(page.locator('input[inputmode="decimal"]').first()).toHaveValue('5')
  })

  test('2.8 stepper − diminue le poids de 2.5kg', async ({ page }) => {
    await startWorkout(page)
    await addExercise(page, 'Pompes')
    await addSet(page)
    const wPlus = page.locator('.stepper-btn', { hasText: '+' }).first()
    await wPlus.click(); await wPlus.click(); await wPlus.click() // 0 → 7.5
    await page.locator('.stepper-btn', { hasText: '−' }).first().click() // 7.5 → 5
    await expect(page.locator('input[inputmode="decimal"]').first()).toHaveValue('5')
  })

  test('2.9 stepper reps + augmente d\'1', async ({ page }) => {
    await startWorkout(page)
    await addExercise(page, 'Pompes')
    await addSet(page)
    const rPlus = page.locator('.stepper-btn', { hasText: '+' }).last()
    await rPlus.click(); await rPlus.click() // 8 → 10
    await expect(page.locator('input[inputmode="numeric"]').first()).toHaveValue('10')
  })

  test('2.10 stepper reps − diminue d\'1', async ({ page }) => {
    await startWorkout(page)
    await addExercise(page, 'Pompes')
    await addSet(page)
    await page.locator('.stepper-btn', { hasText: '−' }).last().click() // 8 → 7
    await expect(page.locator('input[inputmode="numeric"]').first()).toHaveValue('7')
  })

  test('2.11 input poids modifiable manuellement', async ({ page }) => {
    await startWorkout(page)
    await addExercise(page, 'Pompes')
    await addSet(page)
    const inp = page.locator('input[inputmode="decimal"]').first()
    await inp.fill('42.5')
    await inp.blur()
    await expect(inp).toHaveValue('42.5')
  })

  test('2.12 toggle échauffement', async ({ page }) => {
    await startWorkout(page)
    await addExercise(page, 'Pompes')
    await addSet(page)
    await page.locator('button', { hasText: 'Série 1' }).click()
    await expect(page.getByText('Échauf.')).toBeVisible()
    await page.getByText('Échauf.').click()
    await expect(page.locator('button', { hasText: 'Série 1' })).toBeVisible()
  })

  test('2.13 cycle RPE : null → 6 → 7', async ({ page }) => {
    await startWorkout(page)
    await addExercise(page, 'Pompes')
    await addSet(page)
    // There are multiple "RPE" buttons — one in set header, one label above
    await page.locator('button', { hasText: 'RPE' }).first().click()
    await expect(page.getByText('RPE 6')).toBeVisible()
    await page.locator('button', { hasText: 'RPE' }).first().click()
    await expect(page.getByText('RPE 7')).toBeVisible()
  })

  test('2.14 supprimer une série', async ({ page }) => {
    await startWorkout(page)
    await addExercise(page, 'Pompes')
    await addSet(page)
    await expect(page.locator('button', { hasText: 'Série 1' })).toBeVisible()
    await page.locator('button', { hasText: '×' }).last().click()
    await expect(page.locator('button', { hasText: 'Série 1' })).not.toBeVisible()
  })

  test('2.15 3 séries numérotées correctement', async ({ page }) => {
    await startWorkout(page)
    await addExercise(page, 'Pompes')
    await addSet(page); await addSet(page); await addSet(page)
    await expect(page.locator('button', { hasText: 'Série 3' })).toBeVisible()
  })

  test('2.16 supprimer un exercice', async ({ page }) => {
    await startWorkout(page)
    await addExercise(page, 'Pompes')
    await page.locator('button', { hasText: '✕' }).first().click()
    await expect(page.getByText('Pompes', { exact: true })).not.toBeVisible()
  })

  test('2.17 ajouter 2 exercices', async ({ page }) => {
    await startWorkout(page)
    await addExercise(page, 'Pompes')
    await addExercise(page, 'Curl barre', 'Biceps')
    await expect(page.getByText('Pompes', { exact: true })).toBeVisible()
    await expect(page.getByText('Curl barre', { exact: true })).toBeVisible()
  })

  test('2.18 réordonner exercices (▼ activé)', async ({ page }) => {
    await startWorkout(page)
    await addExercise(page, 'Pompes')
    await addExercise(page, 'Curl barre', 'Biceps')
    const downBtn = page.locator('button', { hasText: '▼' }).first()
    await expect(downBtn).not.toBeDisabled()
    await downBtn.click()
    await expect(page.getByText('Pompes', { exact: true })).toBeVisible()
  })

  test('2.19 terminer la séance reset l\'écran', async ({ page }) => {
    await startWorkout(page)
    await page.getByText('Terminer').click()
    await expect(page.getByText("Prêt à t'entraîner ?")).toBeVisible()
  })

  test('2.20 timer repos apparaît après ajout de série', async ({ page }) => {
    await startWorkout(page)
    await addExercise(page, 'Pompes')
    await addSet(page)
    await page.waitForTimeout(300)
    await expect(page.getByText('passer')).toBeVisible()
  })

  test('2.21 passer le timer', async ({ page }) => {
    await startWorkout(page)
    await addExercise(page, 'Pompes')
    await addSet(page)
    await page.waitForTimeout(300)
    await page.getByText('passer').click()
    await page.waitForTimeout(300)
    await expect(page.getByText('passer')).not.toBeVisible()
  })

  test('2.22 bouton retour dans le picker', async ({ page }) => {
    await startWorkout(page)
    await page.getByText('+ Ajouter un exercice').click()
    await page.locator('button', { hasText: '←' }).click()
    await expect(page.getByText('Séance en cours')).toBeVisible()
  })
})

// ─── 3. Poids corporel ────────────────────────────────────────────────────────
test.describe('3. Poids corporel', () => {
  test.beforeEach(async ({ page }) => {
    resetDB(); await mockAPIs(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await goTo(page, 'Poids')
    await expect(page.getByRole('heading', { name: 'Poids corporel' })).toBeVisible()
  })

  test('3.1 input poids visible', async ({ page }) => {
    await expect(page.getByPlaceholder('Poids (kg)')).toBeVisible()
  })

  test('3.2 ajouter une entrée', async ({ page }) => {
    await page.getByPlaceholder('Poids (kg)').fill('75.5')
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/bodyweight') && r.request().method() === 'GET'),
      page.locator('button', { hasText: '+' }).click(),
    ])
    await expect(page.getByText('75.5 kg')).toBeVisible()
  })

  test('3.3 l\'input se vide après ajout', async ({ page }) => {
    await page.getByPlaceholder('Poids (kg)').fill('80')
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/bodyweight') && r.request().method() === 'GET'),
      page.locator('button', { hasText: '+' }).click(),
    ])
    await expect(page.getByPlaceholder('Poids (kg)')).toHaveValue('')
  })

  test('3.4 plusieurs entrées affichent les moyennes', async ({ page }) => {
    for (const w of ['74', '75', '76']) {
      await page.getByPlaceholder('Poids (kg)').fill(w)
      await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/bodyweight') && r.request().method() === 'GET'),
        page.locator('button', { hasText: '+' }).click(),
      ])
    }
    await expect(page.getByText('Moy. 7j')).toBeVisible()
  })

  test('3.5 modifier une entrée', async ({ page }) => {
    await page.getByPlaceholder('Poids (kg)').fill('70')
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/bodyweight') && r.request().method() === 'GET'),
      page.locator('button', { hasText: '+' }).click(),
    ])
    await page.locator('button', { hasText: '✎' }).first().click()
    await page.locator('input[inputmode="decimal"]').fill('71')
    await page.locator('button', { hasText: '✓' }).click()
    await expect(page.getByText('71 kg')).toBeVisible()
  })

  test('3.6 supprimer une entrée', async ({ page }) => {
    await page.getByPlaceholder('Poids (kg)').fill('72')
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/bodyweight') && r.request().method() === 'GET'),
      page.locator('button', { hasText: '+' }).click(),
    ])
    await page.locator('button', { hasText: '🗑' }).first().click()
    await page.waitForResponse(r => r.url().includes('/api/bodyweight') && r.request().method() === 'GET')
    await expect(page.getByText('72 kg')).not.toBeVisible()
  })
})

// ─── 4. Historique ───────────────────────────────────────────────────────────
test.describe('4. Historique', () => {
  test.beforeEach(async ({ page }) => {
    resetDB()
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
    await mockAPIs(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await goTo(page, 'Historique')
    await expect(page.getByRole('heading', { name: 'Historique' })).toBeVisible()
  })

  test('4.1 affiche le workout terminé', async ({ page }) => {
    await expect(page.getByText('Pompes', { exact: true })).toBeVisible()
  })

  test('4.2 affiche le nombre de séries', async ({ page }) => {
    await expect(page.getByText('2 séries')).toBeVisible()
  })

  test('4.3 affiche la durée', async ({ page }) => {
    await expect(page.getByText(/h|min/)).toBeVisible()
  })

  test('4.4 supprimer un workout', async ({ page }) => {
    await page.locator('button', { hasText: '🗑' }).first().click()
    await page.waitForResponse(r => r.url().includes('/api/workouts') && r.request().method() === 'DELETE')
    await page.waitForTimeout(800)
    await expect(page.getByText('Pompes', { exact: true })).not.toBeVisible()
  })

  test('4.5 clic exercice → détail exercice', async ({ page }) => {
    await page.getByText('Pompes', { exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Pompes' })).toBeVisible()
    await expect(page.getByText('Poids max')).toBeVisible()
  })
})

// ─── 5. Détail exercice ───────────────────────────────────────────────────────
test.describe('5. Détail exercice', () => {
  test.beforeEach(async ({ page }) => {
    resetDB()
    db.workouts = [
      {
        id: 'ex1', startTime: Date.now() - 86400000, endTime: Date.now() - 82800000,
        exercises: [{ exerciseId: 'push-ups', sets: [
          { id: 's1', weight: 0, reps: 25, timestamp: Date.now() },
          { id: 's2', weight: 0, reps: 20, timestamp: Date.now() },
        ]}]
      },
      {
        id: 'ex2', startTime: Date.now() - 172800000, endTime: Date.now() - 169200000,
        exercises: [{ exerciseId: 'push-ups', sets: [
          { id: 's3', weight: 0, reps: 22, timestamp: Date.now() },
        ]}]
      }
    ]
    await mockAPIs(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await goTo(page, 'Historique')
    await page.getByText('Pompes', { exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Pompes' })).toBeVisible()
  })

  test('5.1 records personnels (poids, reps, vol)', async ({ page }) => {
    for (const t of ['Poids max', 'Reps max', 'Vol max']) {
      await expect(page.getByText(t)).toBeVisible()
    }
  })

  test('5.2 record max reps = 25', async ({ page }) => {
    await expect(page.getByText('25', { exact: true })).toBeVisible()
  })

  test('5.3 graphe de progression visible', async ({ page }) => {
    await expect(page.getByText('Progression')).toBeVisible()
  })

  test('5.4 historique des séances affiché', async ({ page }) => {
    await expect(page.getByText('Historique').last()).toBeVisible()
    await expect(page.getByText(/0kg × 25/)).toBeVisible()
  })

  test('5.5 bouton retour fonctionne', async ({ page }) => {
    await page.locator('button', { hasText: '←' }).click()
    await expect(page.getByRole('heading', { name: 'Historique' })).toBeVisible()
  })
})

// ─── 6. Statistiques ──────────────────────────────────────────────────────────
test.describe('6. Statistiques', () => {
  test.beforeEach(async ({ page }) => {
    resetDB()
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
    await mockAPIs(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await goTo(page, 'Stats')
    await expect(page.getByRole('heading', { name: 'Statistiques' })).toBeVisible()
  })

  test('6.1 total séances', async ({ page }) => {
    await expect(page.getByText('Total séances')).toBeVisible()
  })

  test('6.2 durée moyenne', async ({ page }) => {
    await expect(page.getByText('Durée moy.')).toBeVisible()
  })

  test('6.3 plus longue séance', async ({ page }) => {
    await expect(page.getByText('Plus longue')).toBeVisible()
  })

  test('6.4 semaine vs précédente', async ({ page }) => {
    await expect(page.getByText('Semaine vs. précédente')).toBeVisible()
    await expect(page.getByText('Cette semaine')).toBeVisible()
    await expect(page.getByText('Semaine dernière')).toBeVisible()
  })

  test('6.5 séries totales par muscle', async ({ page }) => {
    await expect(page.getByText('Séries totales par muscle')).toBeVisible()
  })

  test('6.6 muscle le plus entraîné', async ({ page }) => {
    await expect(page.getByText('Plus entraîné')).toBeVisible()
  })
})

// ─── 7. Dashboard ─────────────────────────────────────────────────────────────
test.describe('7. Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    resetDB()
    db.workouts = [{
      id: 'dash1', startTime: Date.now() - 3600000, endTime: Date.now() - 100,
      exercises: [{
        exerciseId: 'push-ups',
        sets: [{ id: 's1', weight: 0, reps: 20, timestamp: Date.now() }]
      }]
    }]
    await mockAPIs(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await page.waitForResponse(r => r.url().includes('/api/workouts'))
    await page.waitForTimeout(500)
  })

  test('7.1 dernière séance visible', async ({ page }) => {
    await expect(page.getByText('Dernière séance')).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('chest')).toBeVisible()
  })

  test('7.2 stats cette semaine', async ({ page }) => {
    await expect(page.getByText('Cette semaine')).toBeVisible()
  })

  test('7.3 stats ce mois', async ({ page }) => {
    await expect(page.getByText('Ce mois')).toBeVisible()
  })

  test('7.4 calendrier activité', async ({ page }) => {
    await expect(page.getByText('Activité (12 semaines)')).toBeVisible()
  })

  test('7.5 alertes fréquence musculaire', async ({ page }) => {
    await expect(page.getByText('Fréquence musculaire (7j)')).toBeVisible()
    await expect(page.getByText('EN RETARD').first()).toBeVisible()
  })

  test('7.6 volume hebdo par muscle', async ({ page }) => {
    await expect(page.getByText('Volume hebdo par muscle')).toBeVisible()
  })
})

// ─── 8. Programmes ────────────────────────────────────────────────────────────
test.describe('8. Programmes', () => {
  test.beforeEach(async ({ page }) => {
    resetDB(); await mockAPIs(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await page.getByText('Programmes').click()
    await expect(page.getByRole('heading', { name: 'Programmes' })).toBeVisible()
  })

  test('8.1 état vide', async ({ page }) => {
    await expect(page.getByText('Aucun programme')).toBeVisible()
  })

  test('8.2 ouvrir l\'éditeur de programme', async ({ page }) => {
    await page.getByText('+ Nouveau').click()
    await expect(page.getByText('Nouveau programme')).toBeVisible()
    await expect(page.getByPlaceholder('Nom du programme')).toBeVisible()
  })

  test('8.3 créer un programme complet', async ({ page }) => {
    await page.getByText('+ Nouveau').click()
    await page.getByPlaceholder('Nom du programme').fill('Push Day')
    // Add exercise button in template editor
    await page.locator('button').filter({ hasText: /^\+/ }).filter({ hasText: /Exercice|Exercise/ }).first().click()
    await page.getByText('Pompes', { exact: true }).first().click()
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/templates') && r.request().method() === 'POST'),
      page.locator('button', { hasText: 'Enregistrer' }).click(),
    ])
    await expect(page.getByText('Push Day')).toBeVisible()
  })

  test('8.4 template avec bouton Démarrer', async ({ page }) => {
    db.templates = [{ id: 't1', name: 'Pull Day', exerciseIds: ['pull-ups'], supersets: [], createdAt: Date.now() }]
    await page.reload(); await page.waitForLoadState('networkidle')
    await page.getByText('Programmes').click()
    await expect(page.getByText('Pull Day')).toBeVisible()
    await expect(page.locator('button', { hasText: 'Démarrer' })).toBeVisible()
  })

  test('8.5 démarrer depuis un template', async ({ page }) => {
    db.templates = [{ id: 't2', name: 'Chest Day', exerciseIds: ['push-ups'], supersets: [], createdAt: Date.now() }]
    await page.reload(); await page.waitForLoadState('networkidle')
    await page.getByText('Programmes').click()
    await page.locator('button', { hasText: 'Démarrer' }).click()
    await expect(page.getByText('Séance en cours')).toBeVisible()
    await expect(page.getByText('Pompes', { exact: true })).toBeVisible()
  })

  test('8.6 supprimer un template', async ({ page }) => {
    db.templates = [{ id: 't3', name: 'Leg Day', exerciseIds: ['pull-ups'], supersets: [], createdAt: Date.now() }]
    await page.reload(); await page.waitForLoadState('networkidle')
    await page.getByText('Programmes').click()
    await expect(page.getByText('Leg Day')).toBeVisible()
    await page.locator('button', { hasText: '🗑' }).first().click()
    await page.waitForResponse(r => r.url().includes('/api/templates') && r.request().method() === 'DELETE')
    await page.waitForTimeout(500)
    await expect(page.getByText('Leg Day')).not.toBeVisible()
  })
})

// ─── 9. Surcharge progressive ─────────────────────────────────────────────────
test.describe('9. Surcharge progressive', () => {
  test.beforeEach(async ({ page }) => {
    resetDB()
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
      }
    ]
    await mockAPIs(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await page.locator('nav button.absolute').click()
    await startWorkout(page)
    await addExercise(page, 'Curl barre', 'Biceps')
  })

  test('9.1 recommandation progression affichée', async ({ page }) => {
    await expect(page.getByText(/Passe à|vise|Tous les sets|aim/).first()).toBeVisible({ timeout: 5000 })
  })

  test('9.2 badge tendance visible', async ({ page }) => {
    await expect(page.locator('span').filter({ hasText: /^↗$|^→$|^↘$/ }).first()).toBeVisible({ timeout: 5000 })
  })

  test('9.3 sets précédents pré-remplis', async ({ page }) => {
    await expect(page.getByText('Précédent')).toBeVisible()
    await expect(page.getByText(/30×12|30kg/)).toBeVisible()
  })
})

// ─── 10. Gestion erreurs ──────────────────────────────────────────────────────
test.describe('10. Gestion des erreurs', () => {
  test('10.1 API 500 — app ne crashe pas', async ({ page }) => {
    await page.route('**/api/workouts**', r => r.fulfill({ status: 500, json: { error: 'fail' } }))
    await page.route('**/api/bodyweight**', r => r.fulfill({ json: [] }))
    await page.route('**/api/templates**', r => r.fulfill({ json: [] }))
    await page.route('**/api/settings**', r => r.fulfill({ json: [] }))
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()
  })

  test('10.2 aucune erreur JS au chargement', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    resetDB(); await mockAPIs(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    expect(errors).toHaveLength(0)
  })

  test('10.3 DB vide — états vides corrects', async ({ page }) => {
    resetDB(); await mockAPIs(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await expect(page.getByText('Tableau de bord')).toBeVisible()
    await goTo(page, 'Historique')
    await expect(page.getByText('Aucune séance')).toBeVisible()
  })
})

// ─── 11. UX Mobile ────────────────────────────────────────────────────────────
test.describe('11. UX Mobile', () => {
  test.beforeEach(async ({ page }) => {
    resetDB(); await mockAPIs(page)
    await page.goto('/'); await page.waitForLoadState('networkidle')
    await page.locator('nav button.absolute').click()
    await startWorkout(page)
    await addExercise(page, 'Pompes')
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

  test('11.2 inputs numérique ≥ 44px de hauteur', async ({ page }) => {
    const inputs = page.locator('input[type="number"]')
    const count = await inputs.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      const box = await inputs.nth(i).boundingBox()
      if (box) expect(box.height, `Input ${i}: ${box.height}px`).toBeGreaterThanOrEqual(44)
    }
  })

  test('11.3 FAB ≥ 48px', async ({ page }) => {
    await page.goto('/')
    const fab = page.locator('nav button.absolute')
    const box = await fab.boundingBox()
    expect(box).toBeTruthy()
    expect(box!.width).toBeGreaterThanOrEqual(48)
    expect(box!.height).toBeGreaterThanOrEqual(48)
  })

  test('11.4 viewport mobile 390px', async ({ page }) => {
    const vp = page.viewportSize()
    expect(vp?.width).toBe(390)
  })
})
