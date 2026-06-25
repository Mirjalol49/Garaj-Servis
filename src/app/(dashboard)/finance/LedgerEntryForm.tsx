'use client'

import { FormEvent, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addLedgerEntry } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Option = {
  id: string
  label: string
}

const ENTRY_TYPES = [
  { value: 'customer_payment', label: 'Customer payment' },
  { value: 'master_payment', label: 'Master payment' },
  { value: 'supplier_payment', label: 'Supplier payment' },
  { value: 'refund', label: 'Refund' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'other_income', label: 'Other income' },
  { value: 'other_expense', label: 'Other expense' },
]

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'click', label: 'Click' },
  { value: 'payme', label: 'Payme' },
  { value: 'other', label: 'Other' },
]

export default function LedgerEntryForm({
  jobs,
  companies,
  masters,
}: {
  jobs: Option[]
  companies: Option[]
  masters: Option[]
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [entryType, setEntryType] = useState('customer_payment')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setError(null)
    startTransition(async () => {
      const result = await addLedgerEntry(new FormData(form))
      if (result?.error) {
        setError(result.error)
        return
      }
      formRef.current?.reset()
      setEntryType('customer_payment')
      router.refresh()
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-[var(--font-geist)]">New ledger entry</p>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <select
          name="entry_type"
          value={entryType}
          onChange={(event) => setEntryType(event.target.value)}
          className="h-10 rounded-md border border-border bg-muted px-3 text-sm text-foreground"
        >
          {ENTRY_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        <Input name="amount" type="number" step="0.01" min="0.01" placeholder="Amount" required disabled={isPending} />
        <select name="payment_method" defaultValue="cash" className="h-10 rounded-md border border-border bg-muted px-3 text-sm text-foreground">
          {PAYMENT_METHODS.map((method) => (
            <option key={method.value} value={method.value}>{method.label}</option>
          ))}
        </select>
        <select name="job_order_id" defaultValue="" className="h-10 rounded-md border border-border bg-muted px-3 text-sm text-foreground">
          <option value="">No job selected</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>{job.label}</option>
          ))}
        </select>
        <select
          name="customer_company_id"
          defaultValue=""
          required={entryType === 'customer_payment'}
          className="h-10 rounded-md border border-border bg-muted px-3 text-sm text-foreground"
        >
          <option value="">No customer selected</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>{company.label}</option>
          ))}
        </select>
        <select
          name="master_id"
          defaultValue=""
          required={entryType === 'master_payment'}
          className="h-10 rounded-md border border-border bg-muted px-3 text-sm text-foreground"
        >
          <option value="">No master selected</option>
          {masters.map((master) => (
            <option key={master.id} value={master.id}>{master.label}</option>
          ))}
        </select>
        {entryType === 'adjustment' && (
          <select name="direction" defaultValue="in" className="h-10 rounded-md border border-border bg-muted px-3 text-sm text-foreground">
            <option value="in">Cash in</option>
            <option value="out">Cash out</option>
          </select>
        )}
        <Input name="entry_date" type="date" disabled={isPending} />
        <Input name="description" placeholder="Description" disabled={isPending} />
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={isPending}>Save ledger entry</Button>
      </div>
    </form>
  )
}
