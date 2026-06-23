import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Car, Building2, Calendar, Gauge, FileText, AlertTriangle, ImagePlus } from 'lucide-react'
import JobStepsPanel from './JobStepsPanel'
import JobStatusControl from './JobStatusControl'
import PhotoUploader from './PhotoUploader'
import JobFinancePanel from './JobFinancePanel'
import { getSignedViewUrls } from '../photo-actions'
import { calculateJobFinance, toMoneyNumber } from '@/lib/finance/calculations'

function formatMoney(n: number) {
  return new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 0 }).format(n)
}

type JobPhoto = {
  id: string
  photo_type: 'intake' | 'damage' | 'progress' | 'parts' | 'final'
  storage_path: string
  created_at: string | null
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
  customer_company_id: string | null
}

const PHOTO_TYPE_LABELS: Record<JobPhoto['photo_type'], string> = {
  intake: 'Intake',
  damage: 'Damage',
  progress: 'Progress',
  parts: 'Parts',
  final: 'Final',
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()
  const supabase = await createClient()
  const { id } = await params

  // Fetch job with relations
  const { data: job, error } = await supabase
    .from('job_orders')
    .select(`
      *,
      cars ( plate_number, make, model, year, color ),
      customer_companies ( id, name ),
      job_steps (
        id, description, status, assigned_master_id, customer_price, master_cost, started_at, completed_at,
        masters ( name )
      ),
      job_issues ( id, title, description, severity ),
      job_photos ( id, photo_type, storage_path, created_at ),
      job_expenses ( id, expense_type, description, supplier_name, quantity, unit_cost, total_cost, created_at ),
      ledger_entries ( id, entry_type, direction, amount, payment_method, description, entry_date, master_id, customer_company_id )
    `)
    .eq('id', id)
    .single()

  if (error || !job) notFound()

  // Fetch active masters for assignment
  const { data: masters } = await supabase
    .from('masters')
    .select('id, name')
    .eq('active', true)
    .order('name')

  const car = Array.isArray(job.cars) ? job.cars[0] : job.cars
  const company = Array.isArray(job.customer_companies) ? job.customer_companies[0] : job.customer_companies
  const steps = job.job_steps ?? []
  const issues = job.job_issues ?? []
  const expenses = ([...(job.job_expenses ?? [])] as JobExpense[])
  const ledgerEntries = ([...(job.ledger_entries ?? [])] as LedgerEntry[]).sort((a, b) => {
    return new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
  })
  const photos = ([...(job.job_photos ?? [])] as JobPhoto[]).sort((a, b) => {
    return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  })
  const { urls: signedPhotoUrls } = await getSignedViewUrls(photos.map((photo) => photo.storage_path))

  const totalRevenue = steps.reduce((sum: number, step: { customer_price: number | string }) => {
    return sum + toMoneyNumber(step.customer_price)
  }, 0)
  const totalCost = steps.reduce((sum: number, step: { master_cost: number | string }) => {
    return sum + toMoneyNumber(step.master_cost)
  }, 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + toMoneyNumber(expense.total_cost), 0)
  const customerPayments = ledgerEntries
    .filter((entry) => entry.entry_type === 'customer_payment')
    .reduce((sum, entry) => sum + toMoneyNumber(entry.amount), 0)
  const masterPayments = ledgerEntries
    .filter((entry) => entry.entry_type === 'master_payment')
    .reduce((sum, entry) => sum + toMoneyNumber(entry.amount), 0)
  const finance = calculateJobFinance({
    customerRevenue: totalRevenue,
    masterCost: totalCost,
    jobExpenses: totalExpenses,
    customerPayments,
    masterPayments,
  })

  return (
    <div className="max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link href="/jobs" className="inline-flex items-center gap-1.5 text-xs text-[#859585] hover:text-[#dbe5d9] transition-colors mb-4">
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to Jobs
        </Link>

        {/* Job header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)] mb-1">
              Job Order
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-[#dbe5d9] font-mono">
              {job.job_number}
            </h1>
          </div>
          <JobStatusControl jobId={job.id} currentStatus={job.status} />
        </div>
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#161616] border border-[#262626]">
          <Car className="w-4 h-4 text-[#00e475] mt-0.5 shrink-0" />
          <div>
            <p className="text-xs uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">Car</p>
            <p className="font-mono font-semibold text-[#dbe5d9]">{car?.plate_number}</p>
            <p className="text-xs text-[#859585]">{[car?.year, car?.make, car?.model].filter(Boolean).join(' ')}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#161616] border border-[#262626]">
          <Building2 className="w-4 h-4 text-[#0068ed] mt-0.5 shrink-0" />
          <div>
            <p className="text-xs uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">Company</p>
            <p className="font-semibold text-[#dbe5d9] text-sm">{company?.name ?? '—'}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#161616] border border-[#262626]">
          <Calendar className="w-4 h-4 text-[#ffba79] mt-0.5 shrink-0" />
          <div>
            <p className="text-xs uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">Opened</p>
            <p className="font-semibold text-[#dbe5d9] text-sm">
              {new Date(job.opened_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#161616] border border-[#262626]">
          <Gauge className="w-4 h-4 text-[#bacbb9] mt-0.5 shrink-0" />
          <div>
            <p className="text-xs uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">Odometer</p>
            <p className="font-semibold text-[#dbe5d9] text-sm">
              {job.intake_odometer != null ? `${job.intake_odometer.toLocaleString()} km` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Problem description */}
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-6">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-[#859585]" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">Problem Description</p>
        </div>
        <p className="text-[#dbe5d9] text-sm leading-relaxed">{job.problem_description}</p>
        {job.internal_notes && (
          <div className="mt-4 pt-4 border-t border-[#262626]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#3b4a3d] font-[var(--font-geist)] mb-1">Internal Notes</p>
            <p className="text-[#859585] text-sm leading-relaxed">{job.internal_notes}</p>
          </div>
        )}
      </div>

      {/* Finance summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Customer Revenue', value: formatMoney(finance.customerRevenue), color: 'text-[#00e475]' },
          { label: 'Total Cost', value: formatMoney(finance.masterCost + finance.jobExpenses), color: 'text-[#ffba79]' },
          { label: 'Gross Profit', value: formatMoney(finance.grossProfit), color: finance.grossProfit >= 0 ? 'text-[#00e475]' : 'text-[#ffb4ab]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="px-5 py-4 rounded-2xl bg-[#161616] border border-[#262626]">
            <p className="text-xs uppercase tracking-widest text-[#859585] font-[var(--font-geist)] mb-1.5">{label}</p>
            <p className={`text-2xl font-semibold font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Job Steps */}
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)] mb-4">
          Job Steps & Assignments
        </p>
        <JobStepsPanel
          jobId={job.id}
          initialSteps={steps as Parameters<typeof JobStepsPanel>[0]['initialSteps']}
          masters={masters ?? []}
        />
      </div>

      {/* Finance */}
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)] mb-4">
          Expenses & Ledger
        </p>
        <JobFinancePanel
          jobId={job.id}
          customerCompanyId={job.customer_company_id}
          masters={masters ?? []}
          expenses={expenses}
          ledgerEntries={ledgerEntries}
          totals={finance}
        />
      </div>

      {/* Photos */}
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-6">
        <div className="flex items-center gap-2 mb-4">
          <ImagePlus className="w-4 h-4 text-[#00e475]" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">
            Job Photos
          </p>
        </div>
        <PhotoUploader jobOrderId={job.id} />
        <div className="mt-5 border-t border-[#262626] pt-5">
          {photos.length === 0 ? (
            <p className="text-sm text-[#859585]">No photos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {photos.map((photo) => {
                const signedUrl = signedPhotoUrls[photo.storage_path]
                return (
                  <a
                    key={photo.id}
                    href={signedUrl ?? '#'}
                    target={signedUrl ? '_blank' : undefined}
                    rel="noreferrer"
                    className="group overflow-hidden rounded-xl border border-[#262626] bg-[#0d0d0d]"
                  >
                    <div className="aspect-square bg-[#0d0d0d]">
                      {signedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={signedUrl}
                          alt={`${PHOTO_TYPE_LABELS[photo.photo_type]} job photo`}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-3 text-center text-xs text-[#859585]">
                          Preview unavailable
                        </div>
                      )}
                    </div>
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold text-[#dbe5d9]">
                        {PHOTO_TYPE_LABELS[photo.photo_type]}
                      </p>
                      <p className="text-xs text-[#859585]">
                        {photo.created_at
                          ? new Date(photo.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Date unavailable'}
                      </p>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Issues */}
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-[#ffba79]" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">
            Issues Logged
          </p>
        </div>
        {issues.length === 0 ? (
          <p className="text-sm text-[#859585]">No issues recorded.</p>
        ) : (
          <div className="space-y-2">
            {issues.map((issue: { id: string; title: string; description?: string; severity?: string }) => (
              <div key={issue.id} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#0d0d0d] border border-[#262626]">
                <span className={`mt-0.5 text-xs font-semibold uppercase px-1.5 py-0.5 rounded-full border ${
                  issue.severity === 'high'
                    ? 'text-[#ffb4ab] border-[#93000a]/40 bg-[#93000a]/10'
                    : issue.severity === 'medium'
                    ? 'text-[#ffba79] border-[#ffba79]/30 bg-[#ffba79]/10'
                    : 'text-[#859585] border-[#3b4a3d]'
                }`}>
                  {issue.severity ?? 'low'}
                </span>
                <div>
                  <p className="text-sm font-medium text-[#dbe5d9]">{issue.title}</p>
                  {issue.description && <p className="text-xs text-[#859585] mt-0.5">{issue.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
