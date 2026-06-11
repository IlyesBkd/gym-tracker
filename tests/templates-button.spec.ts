import { test, expect } from '@playwright/test'

test('bouton Créer mon premier programme ouvre l\'éditeur', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Click "Voir tout" or "Commencer" from dashboard to go to templates
  const commencerBtn = page.locator('button', { hasText: 'Commencer' })
  if (await commencerBtn.isVisible()) {
    await commencerBtn.click()
  } else {
    const voirTout = page.locator('button', { hasText: 'Voir tout' })
    await voirTout.click()
  }

  // Should see the templates screen
  await expect(page.locator('text=Programmes')).toBeVisible()

  // Click "Créer mon premier programme"
  const creerBtn = page.locator('button', { hasText: 'Créer mon premier programme' })
  if (await creerBtn.isVisible()) {
    await creerBtn.click()
  } else {
    // If templates exist, click "+ Nouveau"
    const nouveauBtn = page.locator('button', { hasText: 'Nouveau' })
    await nouveauBtn.click()
  }

  // Should see the template editor
  await expect(page.locator('text=Nouveau programme')).toBeVisible()
  await expect(page.locator('input[placeholder*="Nom du programme"]')).toBeVisible()
})

test('bouton + Nouveau ouvre l\'éditeur', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Navigate to templates
  const commencerBtn = page.locator('button', { hasText: 'Commencer' })
  if (await commencerBtn.isVisible()) {
    await commencerBtn.click()
  } else {
    const voirTout = page.locator('button', { hasText: 'Voir tout' })
    await voirTout.click()
  }

  await expect(page.locator('h1', { hasText: 'Programmes' })).toBeVisible()

  // Click "+ Nouveau"
  const nouveauBtn = page.locator('button', { hasText: 'Nouveau' })
  await nouveauBtn.click()

  // Should open editor
  await expect(page.locator('text=Nouveau programme')).toBeVisible()
})
