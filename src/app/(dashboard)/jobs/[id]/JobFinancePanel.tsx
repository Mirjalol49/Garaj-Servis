'use client'

import { FormEvent, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addJobExpense, addLedgerEntry } from '../../finance/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type MasterOption = {
  id: string
  name: string
}

type JobExpense = {
  id: string
  expense_type: string
  description: string
  supplier_name: string | null
  quantity: number | string | null
  unit_cost: number | string | null
  total_cost: number | string | null
}

type LedgerEntry = {
  id: string
  entry_type: string
  direction: 'in' | 'out'
  amount: number | string
  payment_method: string | null
  description: string | null
  entry_date: string
  master_id: string | null
}

type FinanceTotals = {
  customerRevenue: number
  masterCost: number
  jobExpenses: number
  customerPayments: number
  masterPayments: number
  grossProfit: number
  receivable: number
  masterPayable: number
}

const EXPENSE_TYPES = [
  { value: 'part', label: 'Part' },
  { value: 'material', label: 'Material' },
  { value: 'outside_service', label: 'Outside service' },
  { value: 'tool', label: 'Tool' },
  { value: 'other', label: 'Other' },
]

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'click', label: 'Click' },
  { value: 'payme', label: 'Payme' },
  { value: 'other', label: 'Other' },
]

function formatMoney(n: number | string | null | undefined) {
  return new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 0 }).format(Number(n ?? 0))
}

function labelForEntry(entryType: string) {
  return entryType.replaceAll('_', ' ')
}

export default function JobFinancePanel({
  jobId,
  customerCompanyId,
  masters,
  expenses,
  ledgerEntries,
  totals,
}: {
  jobId: string
  customerCompanyId: string | null
  masters: MasterOption[]
  expenses: JobExpense[]
  ledgerEntries: LedgerEntry[]
  totals: FinanceTotals
}) {
  const router = useRouter()
  const expenseFormRef = useRef<HTMLFormElement>(null)
  const customerPaymentFormRef = useRef<HTMLFormElement>(null)
  const masterPaymentFormRef = useRef<HTMLFormElement>(null)
  const [expenseError, setExpenseError] = useState<string | null>(null)
  const [customerPaymentError, setCustomerPaymentError] = useState<string | null>(null)
  const [masterPaymentError, setMasterPaymentError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setExpenseError(null)
    startTransition(async () => {
      const result = await addJobExpense(new FormData(form))
      if (result?.error) {
        setExpenseError(result.error)
        return
      }
      expenseFormRef.current?.reset()
      router.refresh()
    })
  }

  function submitCustomerPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setCustomerPaymentError(null)
    startTransition(async () => {
      const result = await addLedgerEntry(new FormData(form))
      if (result?.error) {
        setCustomerPaymentError(result.error)
        return
      }
      customerPaymentFormRef.current?.reset()
      router.refresh()
    })
  }

  function submitMasterPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setMasterPaymentError(null)
    startTransition(async () => {
      const result = await addLedgerEntry(new FormData(form))
      if (result?.error) {
        setMasterPaymentError(result.error)
        return
      }
      masterPaymentFormRef.current?.reset()
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Job Expenses', value: totals.jobExpenses, color: 'text-[#ffba79]' },
          { label: 'Customer Paid', value: totals.customerPayments, color: 'text-primary' },
          { label: 'Receivable', value: totals.receivable, color: totals.receivable > 0 ? 'text-[#ffba79]' : 'text-primary' },
          { label: 'Master Payable', value: totals.masterPayable, color: totals.masterPayable > 0 ? 'text-[#ffba79]' : 'text-primary' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-border bg-muted px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-[var(--font-geist)]">{label}</p>
            <p className={`mt-1 font-mono text-xl font-semibold ${color}`}>{formatMoney(value)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <form ref={expenseFormRef} onSubmit={submitExpense} className="space-y-3 rounded-xl border border-border bg-muted p-4">
          <input type="hidden" name="job_order_id" value={jobId} />
          <p className="text-sm font-semibold text-foreground">Add job expense</p>
          {expenseError && <p className="text-xs text-destructive">{expenseError}</p>}
          <select name="expense_type" defaultValue="part" className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground">
            {EXPENSE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <Input name="description" placeholder="Description" required disabled={isPending} />
          <Input name="supplier_name" placeholder="Supplier" disabled={isPending} />
          <div className="grid grid-cols-2 gap-2">
            <Input name="quantity" type="number" step="0.01" min="0.01" defaultValue="1" required disabled={isPending} />
            <Input name="unit_cost" type="number" step="0.01" min="0" placeholder="Unit cost" required disabled={isPending} />
          </div>
          <Button type="submit" size="sm" className="w-full" disabled={isPending}>Save expense</Button>
        </form>

        <form ref={customerPaymentFormRef} onSubmit={submitCustomerPayment} className="space-y-3 rounded-xl border border-border bg-muted p-4">
          <input type="hidden" name="job_order_id" value={jobId} />
          <input type="hidden" name="customer_company_id" value={customerCompanyId ?? ''} />
          <input type="hidden" name="entry_type" value="customer_payment" />
          <p className="text-sm font-semibold text-foreground">Customer payment</p>
          {customerPaymentError && <p className="text-xs text-destructive">{customerPaymentError}</p>}
          <Input name="amount" type="number" step="0.01" min="0.01" placeholder="Amount received" required disabled={isPending} />
          <select name="payment_method" defaultValue="cash" className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground">
            {PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>{method.label}</option>
            ))}
          </select>
          <Input name="entry_date" type="date" disabled={isPending} />
          <Input name="description" placeholder="Note" disabled={isPending} />
          <Button type="submit" size="sm" className="w-full" disabled={isPending || !customerCompanyId}>Record payment</Button>
        </form>

        <form ref={masterPaymentFormRef} onSubmit={submitMasterPayment} className="space-y-3 rounded-xl border border-border bg-muted p-4">
          <input type="hidden" name="job_order_id" value={jobId} />
          <input type="hidden" name="entry_type" value="master_payment" />
          <p className="text-sm font-semibold text-foreground">Master payment</p>
          {masterPaymentError && <p className="text-xs text-destructive">{masterPaymentError}</p>}
          <select name="master_id" defaultValue="" required className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground">
            <option value="" disabled>Select master</option>
            {masters.map((master) => (
              <option key={master.id} value={master.id}>{master.name}</option>
            ))}
          </select>
          <Input name="amount" type="number" step="0.01" min="0.01" placeholder="Amount paid" required disabled={isPending} />
          <select name="payment_method" defaultValue="cash" className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground">
            {PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>{method.label}</option>
            ))}
          </select>
          <Input name="entry_date" type="date" disabled={isPending} />
          <Button type="submit" size="sm" className="w-full" disabled={isPending || masters.length === 0}>Record payout</Button>
        </form>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground font-[var(--font-geist)]">Expenses</p>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses recorded.</p>
          ) : (
            <div className="space-y-2">
              {expenses.map((expense) => (
                <div key={expense.id} className="rounded-xl border border-border bg-muted px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {expense.expense_type.replaceAll('_', ' ')}
                        {expense.supplier_name ? ` · ${expense.supplier_name}` : ''}
                      </p>
                    </div>
                    <p className="font-mono text-sm font-semibold text-[#ffba79]">{formatMoney(expense.total_cost)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground font-[var(--font-geist)]">Ledger</p>
          {ledgerEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded.</p>
          ) : (
            <div className="space-y-2">
              {ledgerEntries.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-border bg-muted px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium capitalize text-foreground">{labelForEntry(entry.entry_type)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.entry_date).toLocaleDateString('en-GB')}
                        {entry.payment_method ? ` · ${entry.payment_method.replaceAll('_', ' ')}` : ''}
                      </p>
                      {entry.description && <p className="mt-1 text-xs text-muted-foreground">{entry.description}</p>}
                    </div>
                    <p className={`font-mono text-sm font-semibold ${entry.direction === 'in' ? 'text-primary' : 'text-[#ffba79]'}`}>
                      {entry.direction === 'in' ? '+' : '-'}{formatMoney(entry.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
