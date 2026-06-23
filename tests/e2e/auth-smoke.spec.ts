import { expect, test } from '@playwright/test'

test('login page uses phone number access', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: /GarajServis/i })).toBeVisible()
  const phone = page.getByLabel(/phone number/i)
  await phone.click()
  await phone.pressSequentially('937abc489141')

  await expect(phone).toHaveValue('937489141')
  await expect(page.getByLabel(/password/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
})

test('dashboard redirects unauthenticated visitors to login', async ({ page }) => {
  await page.goto('/dashboard')

  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByLabel(/phone number/i)).toBeVisible()
})

test('finance CSV export rejects unauthenticated requests', async ({ request }) => {
  const response = await request.get('/finance/export?report=ledger')

  expect(response.status()).toBe(401)
})
