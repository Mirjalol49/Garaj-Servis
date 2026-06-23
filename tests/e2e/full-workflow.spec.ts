import { expect, test } from '@playwright/test'

const phone = process.env.E2E_PHONE
const password = process.env.E2E_PASSWORD
const runFullWorkflow = process.env.E2E_FULL_WORKFLOW === '1'

test.describe('authenticated production workflow', () => {
  test.skip(!runFullWorkflow || !phone || !password, 'Set E2E_FULL_WORKFLOW=1, E2E_PHONE, and E2E_PASSWORD to run the full workflow.')

  test('creates company, car, job, expenses, payments, and verifies finance surfaces', async ({ page }) => {
    const suffix = Date.now().toString()
    const companyName = `E2E Fleet ${suffix}`
    const plateNumber = `E2E${suffix.slice(-6)}`

    await page.goto('/login')
    await page.getByLabel(/phone number/i).fill(phone as string)
    await page.getByLabel(/password/i).fill(password as string)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/)

    await page.goto('/companies')
    await page.getByRole('button', { name: /add company/i }).click()
    await page.getByLabel(/company name/i).fill(companyName)
    await page.getByLabel(/contact person/i).fill('E2E Owner')
    await page.getByLabel(/phone number/i).fill(`99890${suffix.slice(-7)}`)
    await page.getByRole('button', { name: /create company/i }).click()
    await expect(page.getByText(companyName)).toBeVisible()

    await page.goto('/cars')
    await page.getByRole('button', { name: /add car/i }).click()
    await page.getByText(/select a company/i).click()
    await page.getByText(companyName).click()
    await page.getByLabel(/plate number/i).fill(plateNumber)
    await page.getByLabel(/make/i).fill('Toyota')
    await page.getByLabel(/model/i).fill('Camry')
    await page.getByRole('button', { name: /create car/i }).click()
    await expect(page.getByText(plateNumber)).toBeVisible()

    await page.goto('/jobs/new')
    await page.getByPlaceholder(/01A123BB/i).fill(plateNumber)
    await page.getByRole('button').filter({ hasText: /^$/ }).first().click()
    await page.getByText(plateNumber).click()
    await page.getByLabel(/problem description/i).fill('E2E repair workflow')
    await page.getByRole('button', { name: /create job order/i }).click()
    await expect(page).toHaveURL(/\/jobs\/[^/]+$/)

    await page.getByRole('button', { name: /add step/i }).click()
    await page.getByLabel(/description/i).fill('Diagnostics')
    await page.getByLabel(/customer price/i).fill('1000000')
    await page.getByLabel(/master cost/i).fill('300000')
    await page.getByRole('button', { name: /save step/i }).click()
    await expect(page.getByText('Diagnostics')).toBeVisible()

    await page.getByPlaceholder(/description/i).fill('E2E part')
    await page.getByPlaceholder(/unit cost/i).fill('100000')
    await page.getByRole('button', { name: /save expense/i }).click()
    await expect(page.getByText('E2E part')).toBeVisible()

    await page.getByPlaceholder(/amount received/i).fill('500000')
    await page.getByRole('button', { name: /record payment/i }).click()
    await expect(page.getByText(/customer payment/i)).toBeVisible()

    await page.goto('/dashboard')
    await expect(page.getByText(/owner overview/i)).toBeVisible()
    await page.goto('/finance')
    await expect(page.getByText(/ledger, cashflow & reports/i)).toBeVisible()
  })
})
