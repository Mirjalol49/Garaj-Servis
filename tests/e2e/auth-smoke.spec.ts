import { expect, test } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

test('login page uses phone number access', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })

  await expect(page.getByRole('heading', { name: /GarajServis/i })).toBeVisible()
  await expect(page.locator('button[aria-label^="Switch to"]')).toBeEnabled()
  const phone = page.getByLabel(/phone number/i)
  await phone.click()
  await phone.pressSequentially('937abc489141')

  await expect(phone).toHaveValue('937489141')
  await expect(page.getByLabel(/password/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
})

test('dashboard redirects unauthenticated visitors to login', async ({ request }) => {
  const response = await request.get('/dashboard', { maxRedirects: 0 })

  expect(response.status()).toBe(307)
  expect(response.headers().location).toBe('/login')
})

test('finance CSV export rejects unauthenticated requests', async ({ request }) => {
  const response = await request.get('/finance/export?report=ledger')

  expect(response.status()).toBe(401)
})
