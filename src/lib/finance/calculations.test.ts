import { expect, test } from 'vitest'
import { calculateCashflow, calculateJobFinance, toMoneyNumber } from './calculations.ts'
import {
  buildCompanyReceivablesReport,
  buildFinanceSummary,
  buildMasterPayablesReport,
  type ReportJob,
  type ReportLedgerEntry,
} from './reports.ts'

test('toMoneyNumber normalizes invalid values to zero', () => {
  expect(toMoneyNumber(null)).toBe(0)
  expect(toMoneyNumber(undefined)).toBe(0)
  expect(toMoneyNumber('not-money')).toBe(0)
  expect(toMoneyNumber('12500.50')).toBe(12500.5)
})

test('job gross profit subtracts master cost and job expenses from revenue', () => {
  const result = calculateJobFinance({
    customerRevenue: 1_000_000,
    masterCost: 300_000,
    jobExpenses: 125_000,
    customerPayments: 0,
    masterPayments: 0,
  })

  expect(result.grossProfit).toBe(575_000)
})

test('receivable is remaining customer revenue after customer payments', () => {
  const result = calculateJobFinance({
    customerRevenue: 1_000_000,
    masterCost: 0,
    jobExpenses: 0,
    customerPayments: 400_000,
    masterPayments: 0,
  })

  expect(result.receivable).toBe(600_000)
})

test('receivable never goes below zero after overpayment', () => {
  const result = calculateJobFinance({
    customerRevenue: 1_000_000,
    masterCost: 0,
    jobExpenses: 0,
    customerPayments: 1_200_000,
    masterPayments: 0,
  })

  expect(result.receivable).toBe(0)
})

test('master payable is remaining master cost after master payments', () => {
  const result = calculateJobFinance({
    customerRevenue: 0,
    masterCost: 500_000,
    jobExpenses: 0,
    customerPayments: 0,
    masterPayments: 200_000,
  })

  expect(result.masterPayable).toBe(300_000)
})

test('cashflow equals ledger cash in minus cash out', () => {
  const result = calculateCashflow({
    cashIn: 2_000_000,
    cashOut: 750_000,
  })

  expect(result.netCashflow).toBe(1_250_000)
})

test('company receivables subtract company payments from company job revenue', () => {
  const jobs: ReportJob[] = [
    {
      id: 'job-1',
      job_number: 'JOB-1',
      status: 'ready',
      customer_company_id: 'company-1',
      job_steps: [{ customer_price: 1_000_000, master_cost: 0 }],
    },
  ]
  const ledgerEntries: ReportLedgerEntry[] = [
    {
      entry_type: 'customer_payment',
      direction: 'in',
      amount: 350_000,
      customer_company_id: 'company-1',
    },
  ]

  const [row] = buildCompanyReceivablesReport(jobs, [{ id: 'company-1', name: 'Fleet A' }], ledgerEntries)

  expect(row.companyName).toBe('Fleet A')
  expect(row.receivable).toBe(650_000)
})

test('master payables subtract master payments from assigned step costs', () => {
  const jobs: ReportJob[] = [
    {
      id: 'job-1',
      job_number: 'JOB-1',
      status: 'ready',
      customer_company_id: 'company-1',
      job_steps: [{ customer_price: 0, master_cost: 500_000, assigned_master_id: 'master-1' }],
    },
  ]
  const ledgerEntries: ReportLedgerEntry[] = [
    {
      entry_type: 'master_payment',
      direction: 'out',
      amount: 125_000,
      master_id: 'master-1',
    },
  ]

  const [row] = buildMasterPayablesReport(jobs, [{ id: 'master-1', name: 'Ali' }], ledgerEntries)

  expect(row.masterName).toBe('Ali')
  expect(row.payable).toBe(375_000)
})

test('finance summary reports income expense profit cashflow receivables and payables', () => {
  const jobs: ReportJob[] = [
    {
      id: 'job-1',
      job_number: 'JOB-1',
      status: 'ready',
      customer_company_id: 'company-1',
      job_steps: [{ customer_price: 1_000_000, master_cost: 300_000, assigned_master_id: 'master-1' }],
      job_expenses: [{ total_cost: 100_000 }],
      ledger_entries: [
        { entry_type: 'customer_payment', direction: 'in', amount: 250_000 },
        { entry_type: 'master_payment', direction: 'out', amount: 50_000, master_id: 'master-1' },
      ],
    },
  ]
  const ledgerEntries: ReportLedgerEntry[] = [
    { entry_type: 'customer_payment', direction: 'in', amount: 250_000, customer_company_id: 'company-1' },
    { entry_type: 'master_payment', direction: 'out', amount: 50_000, master_id: 'master-1' },
  ]

  const summary = buildFinanceSummary(jobs, ledgerEntries)

  expect(summary.income).toBe(1_000_000)
  expect(summary.expense).toBe(400_000)
  expect(summary.profit).toBe(600_000)
  expect(summary.cashIn).toBe(250_000)
  expect(summary.cashOut).toBe(50_000)
  expect(summary.netCashflow).toBe(200_000)
  expect(summary.receivables).toBe(750_000)
  expect(summary.payables).toBe(250_000)
})
