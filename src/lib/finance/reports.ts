import { calculateCashflow, calculateJobFinance, toMoneyNumber } from './calculations.ts'

export type ReportStep = {
  customer_price: number | string | null
  master_cost: number | string | null
  assigned_master_id?: string | null
}

export type ReportExpense = {
  total_cost: number | string | null
}

export type ReportLedgerEntry = {
  entry_type: string
  direction: 'in' | 'out'
  amount: number | string | null
  job_order_id?: string | null
  customer_company_id?: string | null
  master_id?: string | null
}

export type ReportJob = {
  id: string
  job_number: string
  status: string
  customer_company_id: string | null
  company_name?: string | null
  plate_number?: string | null
  job_steps?: ReportStep[] | null
  job_expenses?: ReportExpense[] | null
  ledger_entries?: ReportLedgerEntry[] | null
}

export type ReportCompany = {
  id: string
  name: string
}

export type ReportMaster = {
  id: string
  name: string
}

export function sumMoney<T>(rows: T[], getValue: (row: T) => number | string | null | undefined) {
  return rows.reduce((sum, row) => sum + toMoneyNumber(getValue(row)), 0)
}

export function buildJobProfitabilityReport(jobs: ReportJob[]) {
  return jobs.map((job) => {
    const steps = job.job_steps ?? []
    const expenses = job.job_expenses ?? []
    const ledgerEntries = job.ledger_entries ?? []
    const finance = calculateJobFinance({
      customerRevenue: sumMoney(steps, (step) => step.customer_price),
      masterCost: sumMoney(steps, (step) => step.master_cost),
      jobExpenses: sumMoney(expenses, (expense) => expense.total_cost),
      customerPayments: sumMoney(
        ledgerEntries.filter((entry) => entry.entry_type === 'customer_payment'),
        (entry) => entry.amount
      ),
      masterPayments: sumMoney(
        ledgerEntries.filter((entry) => entry.entry_type === 'master_payment'),
        (entry) => entry.amount
      ),
    })

    return {
      jobId: job.id,
      jobNumber: job.job_number,
      status: job.status,
      companyName: job.company_name ?? 'No company',
      plateNumber: job.plate_number ?? 'No plate',
      ...finance,
    }
  })
}

export function buildCompanyReceivablesReport(jobs: ReportJob[], companies: ReportCompany[], ledgerEntries: ReportLedgerEntry[]) {
  const companyNames = new Map(companies.map((company) => [company.id, company.name]))
  const revenueByCompany = new Map<string, number>()
  const paymentsByCompany = new Map<string, number>()

  jobs.forEach((job) => {
    if (!job.customer_company_id) return
    const revenue = sumMoney(job.job_steps ?? [], (step) => step.customer_price)
    revenueByCompany.set(job.customer_company_id, (revenueByCompany.get(job.customer_company_id) ?? 0) + revenue)
  })

  ledgerEntries
    .filter((entry) => entry.entry_type === 'customer_payment' && entry.customer_company_id)
    .forEach((entry) => {
      const companyId = entry.customer_company_id as string
      paymentsByCompany.set(companyId, (paymentsByCompany.get(companyId) ?? 0) + toMoneyNumber(entry.amount))
    })

  const companyIds = new Set([...revenueByCompany.keys(), ...paymentsByCompany.keys()])

  return [...companyIds].map((companyId) => {
    const revenue = revenueByCompany.get(companyId) ?? 0
    const paid = paymentsByCompany.get(companyId) ?? 0

    return {
      companyId,
      companyName: companyNames.get(companyId) ?? 'Unknown company',
      revenue,
      paid,
      receivable: Math.max(revenue - paid, 0),
    }
  }).sort((a, b) => b.receivable - a.receivable)
}

export function buildMasterPayablesReport(jobs: ReportJob[], masters: ReportMaster[], ledgerEntries: ReportLedgerEntry[]) {
  const masterNames = new Map(masters.map((master) => [master.id, master.name]))
  const costByMaster = new Map<string, number>()
  const paidByMaster = new Map<string, number>()

  jobs.forEach((job) => {
    ;(job.job_steps ?? []).forEach((step) => {
      if (!step.assigned_master_id) return
      costByMaster.set(step.assigned_master_id, (costByMaster.get(step.assigned_master_id) ?? 0) + toMoneyNumber(step.master_cost))
    })
  })

  ledgerEntries
    .filter((entry) => entry.entry_type === 'master_payment' && entry.master_id)
    .forEach((entry) => {
      const masterId = entry.master_id as string
      paidByMaster.set(masterId, (paidByMaster.get(masterId) ?? 0) + toMoneyNumber(entry.amount))
    })

  const masterIds = new Set([...costByMaster.keys(), ...paidByMaster.keys()])

  return [...masterIds].map((masterId) => {
    const earned = costByMaster.get(masterId) ?? 0
    const paid = paidByMaster.get(masterId) ?? 0

    return {
      masterId,
      masterName: masterNames.get(masterId) ?? 'Unknown master',
      earned,
      paid,
      payable: Math.max(earned - paid, 0),
    }
  }).sort((a, b) => b.payable - a.payable)
}

export function buildFinanceSummary(jobs: ReportJob[], ledgerEntries: ReportLedgerEntry[]) {
  const jobRows = buildJobProfitabilityReport(jobs)
  const cashflow = calculateCashflow({
    cashIn: sumMoney(ledgerEntries.filter((entry) => entry.direction === 'in'), (entry) => entry.amount),
    cashOut: sumMoney(ledgerEntries.filter((entry) => entry.direction === 'out'), (entry) => entry.amount),
  })

  return {
    income: sumMoney(jobRows, (job) => job.customerRevenue),
    expense: sumMoney(jobRows, (job) => job.masterCost + job.jobExpenses),
    profit: sumMoney(jobRows, (job) => job.grossProfit),
    receivables: sumMoney(jobRows, (job) => job.receivable),
    payables: sumMoney(jobRows, (job) => job.masterPayable),
    ...cashflow,
  }
}
