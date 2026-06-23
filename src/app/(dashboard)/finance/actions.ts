'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const EXPENSE_TYPES = ['part', 'material', 'outside_service', 'tool', 'other'] as const
const ENTRY_TYPES = [
  'customer_payment',
  'master_payment',
  'supplier_payment',
  'refund',
  'adjustment',
  'other_income',
  'other_expense',
] as const
const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'click', 'payme', 'other'] as const

const addJobExpenseSchema = z.object({
  job_order_id: z.string().uuid(),
  expense_type: z.enum(EXPENSE_TYPES),
  description: z.string().min(1, 'Description is required.'),
  supplier_name: z.string().optional(),
  quantity: z.coerce.number().positive('Quantity must be greater than zero.'),
  unit_cost: z.coerce.number().nonnegative('Unit cost cannot be negative.'),
})

const ledgerEntrySchema = z.object({
  job_order_id: z.string().uuid().optional(),
  customer_company_id: z.string().uuid().optional(),
  master_id: z.string().uuid().optional(),
  entry_type: z.enum(ENTRY_TYPES),
  direction: z.enum(['in', 'out']).optional(),
  amount: z.coerce.number().positive('Amount must be greater than zero.'),
  payment_method: z.enum(PAYMENT_METHODS).optional(),
  description: z.string().optional(),
  entry_date: z.string().optional(),
})

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key)
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function directionForEntry(entryType: z.infer<typeof ledgerEntrySchema>['entry_type'], requested?: 'in' | 'out') {
  if (entryType === 'customer_payment' || entryType === 'other_income') return 'in'
  if (entryType === 'adjustment') return requested ?? 'in'
  return 'out'
}

function validateLedgerContext(entry: z.infer<typeof ledgerEntrySchema>) {
  if (entry.entry_type === 'customer_payment' && !entry.customer_company_id) {
    return 'Customer payment requires a customer company.'
  }
  if (entry.entry_type === 'master_payment' && !entry.master_id) {
    return 'Master payment requires a master.'
  }
  return null
}

export async function addJobExpense(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = addJobExpenseSchema.safeParse({
    job_order_id: getFormString(formData, 'job_order_id'),
    expense_type: getFormString(formData, 'expense_type'),
    description: getFormString(formData, 'description'),
    supplier_name: getFormString(formData, 'supplier_name'),
    quantity: getFormString(formData, 'quantity') ?? '1',
    unit_cost: getFormString(formData, 'unit_cost') ?? '0',
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('job_expenses').insert({
    ...parsed.data,
    supplier_name: parsed.data.supplier_name ?? null,
    created_by: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath(`/jobs/${parsed.data.job_order_id}`)
  revalidatePath('/finance')
  return { success: true }
}

export async function addLedgerEntry(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = ledgerEntrySchema.safeParse({
    job_order_id: getFormString(formData, 'job_order_id'),
    customer_company_id: getFormString(formData, 'customer_company_id'),
    master_id: getFormString(formData, 'master_id'),
    entry_type: getFormString(formData, 'entry_type'),
    direction: getFormString(formData, 'direction'),
    amount: getFormString(formData, 'amount') ?? '0',
    payment_method: getFormString(formData, 'payment_method'),
    description: getFormString(formData, 'description'),
    entry_date: getFormString(formData, 'entry_date'),
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const contextError = validateLedgerContext(parsed.data)
  if (contextError) return { error: contextError }

  const direction = directionForEntry(parsed.data.entry_type, parsed.data.direction)
  const entryDate = parsed.data.entry_date ?? new Date().toISOString().slice(0, 10)

  const { error } = await supabase.from('ledger_entries').insert({
    job_order_id: parsed.data.job_order_id ?? null,
    customer_company_id: parsed.data.customer_company_id ?? null,
    master_id: parsed.data.master_id ?? null,
    entry_type: parsed.data.entry_type,
    direction,
    amount: parsed.data.amount,
    payment_method: parsed.data.payment_method ?? null,
    description: parsed.data.description ?? null,
    entry_date: entryDate,
    created_by: user.id,
  })

  if (error) return { error: error.message }

  if (parsed.data.job_order_id) revalidatePath(`/jobs/${parsed.data.job_order_id}`)
  revalidatePath('/finance')
  return { success: true }
}
