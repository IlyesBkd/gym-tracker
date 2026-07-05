import { test, expect } from '@playwright/test'

// Vérifie les 2 correctifs : images d'exercices self-host + édition d'une série validée
test.describe('Vérification correctifs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('nav button.rounded-full').click()
    await page.locator('text=Démarrer une séance').click()
    await page.locator('[aria-label="Ajouter un exercice"]').click()
    const ex = page.locator('button').filter({ hasText: /Développé couché haltères|Développé couché assisté/ }).first()
    await ex.click()
    await page.waitForTimeout(800)
  })

  test('image exercice self-host se charge', async ({ page }) => {
    const img = page.locator('img').first()
    await expect(img).toBeVisible()
    const src = await img.getAttribute('src')
    console.log('IMG src =', src)
    expect(src).toContain('/exercises/')
    // L'image doit réellement se charger (naturalWidth > 0)
    await expect.poll(async () => {
      return img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)
    }, { timeout: 5000 }).toBe(true)
  })

  test('peut modifier le poids d\'une série déjà validée', async ({ page }) => {
    // Saisir et valider S1 avec 80 kg
    const weightInput = page.locator('input[type="number"]').first()
    const repsInput = page.locator('input[type="number"]').nth(1)
    await weightInput.fill('80')
    await repsInput.fill('10')
    await page.locator('text=Valider S1').click()
    await page.waitForTimeout(800)

    // Passer le timer de repos si présent
    const skip = page.locator('text=Passer')
    if (await skip.isVisible().catch(() => false)) {
      await skip.click()
      await page.waitForTimeout(500)
    }

    // La série validée affiche 80
    const doneSet = page.locator('button[aria-label="Modifier la série 1"]')
    await expect(doneSet).toBeVisible()
    await expect(doneSet).toContainText('80')

    // Tap sur la série validée -> mode édition
    await doneSet.click()
    await page.waitForTimeout(300)
    await expect(page.locator('text=Modifier la série validée')).toBeVisible()

    // Changer le poids en 90
    const editWeight = page.locator('input[type="number"]').first()
    await editWeight.fill('90')
    await page.locator('button:has-text("OK")').click()
    await page.waitForTimeout(400)

    // La série validée affiche maintenant 90
    const doneSetAfter = page.locator('button[aria-label="Modifier la série 1"]')
    await expect(doneSetAfter).toContainText('90')
    await expect(doneSetAfter).not.toContainText('80')

    // Persistance : recharger la page puis revenir sur la séance conserve 90
    await page.reload()
    await page.waitForTimeout(1000)
    // Après reload l'app revient au dashboard : revenir sur l'onglet séance
    await page.locator('nav button.rounded-full').click()
    await page.waitForTimeout(800)
    await expect(page.locator('button[aria-label="Modifier la série 1"]')).toContainText('90')
  })
})
