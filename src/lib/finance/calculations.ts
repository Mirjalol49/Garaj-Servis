export type JobFinanceInput = {
  customerRevenue: number
  masterCost: number
  jobExpenses: number
  customerPayments: number
  masterPayments: number
}

export type CashflowInput = {
  cashIn: number
  cashOut: number
}

export function toMoneyNumber(value: number | string | null | undefined) {
  const numberValue = Number(value ?? 0)
  return Number.isFinite(numberValue) ? numberValue : 0
}

export function calculateJobFinance(input: JobFinanceInput) {
  const customerRevenue = toMoneyNumber(input.customerRevenue)
  const masterCost = toMoneyNumber(input.masterCost)
  const jobExpenses = toMoneyNumber(input.jobExpenses)
  const customerPayments = toMoneyNumber(input.customerPayments)
  const masterPayments = toMoneyNumber(input.masterPayments)
  const grossProfit = customerRevenue - masterCost - jobExpenses

  return {
    customerRevenue,
    masterCost,
    jobExpenses,
    customerPayments,
    masterPayments,
    grossProfit,
    receivable: Math.max(customerRevenue - customerPayments, 0),
    masterPayable: Math.max(masterCost - masterPayments, 0),
  }
}

export function calculateCashflow(input: CashflowInput) {
  const cashIn = toMoneyNumber(input.cashIn)
  const cashOut = toMoneyNumber(input.cashOut)

  return {
    cashIn,
    cashOut,
    netCashflow: cashIn - cashOut,
  }
}
