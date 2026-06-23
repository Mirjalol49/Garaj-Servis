import { requireAuth } from '@/lib/auth/utils'
import { createClient } from '@/lib/supabase/server'
import {
  buildCompanyReceivablesReport,
  buildFinanceSummary,
  buildJobProfitabilityReport,
  buildMasterPayablesReport,
  type ReportJob,
} from '@/lib/finance/reports'
import LedgerEntryForm from './LedgerEntryForm'

function formatMoney(n: number | string | null | undefined) {
  return new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 0 }).format(Number(n ?? 0))
}

function entryLabel(entryType: string) {
  return entryType.replaceAll('_', ' ')
}

export default async function FinancePage() {
  await requireAuth()
  const supabase = await createClient()

  const [
    { data: ledgerEntries },
    { data: jobs },
    { data: companies },
    { data: masters },
  ] = await Promise.all([
    supabase
      .from('ledger_entries')
      .select('id, entry_type, direction, amount, payment_method, description, entry_date, job_order_id, master_id, customer_company_id')
      .order('entry_date', { ascending: false }),
    supabase
      .from('job_orders')
      .select(`
        id, job_number, status, customer_company_id,
        customer_companies ( name ),
        cars ( plate_number ),
        job_steps ( customer_price, master_cost, assigned_master_id ),
        job_expenses ( total_cost ),
        ledger_entries ( entry_type, direction, amount, master_id, customer_company_id )
      `)
      .order('opened_at', { ascending: false }),
    supabase.from('customer_companies').select('id, name').eq('active', true).order('name'),
    supabase.from('masters').select('id, name').eq('active', true).order('name'),
  ])

  const entries = ledgerEntries ?? []
  const reportJobs: ReportJob[] = (jobs ?? []).map((job) => {
    const company = Array.isArray(job.customer_companies) ? job.customer_companies[0] : job.customer_companies
    const car = Array.isArray(job.cars) ? job.cars[0] : job.cars
    return {
      id: job.id,
      job_number: job.job_number,
      status: job.status,
      customer_company_id: job.customer_company_id,
      company_name: company?.name ?? null,
      plate_number: car?.plate_number ?? null,
      job_steps: job.job_steps ?? [],
      job_expenses: job.job_expenses ?? [],
      ledger_entries: job.ledger_entries ?? [],
    }
  })
  const summary = buildFinanceSummary(reportJobs, entries)
  const jobProfitability = buildJobProfitabilityReport(reportJobs).sort((a, b) => b.grossProfit - a.grossProfit)
  const receivables = buildCompanyReceivablesReport(reportJobs, companies ?? [], entries)
  const payables = buildMasterPayablesReport(reportJobs, masters ?? [], entries)
  const jobOptions = (jobs ?? []).map((job) => {
    const car = Array.isArray(job.cars) ? job.cars[0] : job.cars
    return {
      id: job.id,
      label: [job.job_number, car?.plate_number].filter(Boolean).join(' · '),
    }
  })
  const companyOptions = (companies ?? []).map((company) => ({ id: company.id, label: company.name }))
  const masterOptions = (masters ?? []).map((master) => ({ id: master.id, label: master.name }))

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)] mb-1">
              Finance
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-[#dbe5d9]">Ledger, Cashflow & Reports</h1>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {[
              ['ledger', 'Ledger CSV'],
              ['job-profitability', 'Jobs CSV'],
              ['company-receivables', 'Companies CSV'],
              ['master-payables', 'Masters CSV'],
            ].map(([report, label]) => (
              <a
                key={report}
                href={`/finance/export?report=${report}`}
                className="rounded-xl border border-[#262626] px-3 py-2 text-xs font-semibold text-[#dbe5d9] hover:border-[#00e475]/50 hover:text-[#00e475]"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-6">
        {[
          { label: 'Income', value: summary.income, color: 'text-[#00e475]' },
          { label: 'Expense', value: summary.expense, color: 'text-[#ffba79]' },
          { label: 'Profit', value: summary.profit, color: summary.profit >= 0 ? 'text-[#00e475]' : 'text-[#ffb4ab]' },
          { label: 'Cashflow', value: summary.netCashflow, color: summary.netCashflow >= 0 ? 'text-[#00e475]' : 'text-[#ffb4ab]' },
          { label: 'Receivables', value: receivables.reduce((sum, row) => sum + row.receivable, 0), color: 'text-[#ffba79]' },
          { label: 'Payables', value: payables.reduce((sum, row) => sum + row.payable, 0), color: 'text-[#ffba79]' },
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-[#262626] bg-[#161616] px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">{metric.label}</p>
            <p className={`mt-1 font-mono text-xl font-semibold ${metric.color}`}>{formatMoney(metric.value)}</p>
          </div>
        ))}
      </div>

      <LedgerEntryForm jobs={jobOptions} companies={companyOptions} masters={masterOptions} />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-[#262626] bg-[#161616]">
          <div className="border-b border-[#262626] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">
              Job profitability
            </p>
          </div>
          {jobProfitability.length === 0 ? (
            <p className="px-5 py-6 text-sm text-[#859585]">No jobs to report.</p>
          ) : (
            <div className="divide-y divide-[#262626]">
              {jobProfitability.slice(0, 8).map((job) => (
                <div key={job.jobId} className="grid grid-cols-[1fr_auto] gap-3 px-5 py-4">
                  <div>
                    <p className="font-mono text-sm font-semibold text-[#dbe5d9]">{job.jobNumber}</p>
                    <p className="text-xs text-[#859585]">{[job.plateNumber, job.companyName].filter(Boolean).join(' · ')}</p>
                  </div>
                  <p className={`font-mono text-sm font-semibold ${job.grossProfit >= 0 ? 'text-[#00e475]' : 'text-[#ffb4ab]'}`}>
                    {formatMoney(job.grossProfit)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#262626] bg-[#161616]">
          <div className="border-b border-[#262626] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">
              Company receivables
            </p>
          </div>
          {receivables.length === 0 ? (
            <p className="px-5 py-6 text-sm text-[#859585]">No company balances.</p>
          ) : (
            <div className="divide-y divide-[#262626]">
              {receivables.slice(0, 8).map((row) => (
                <div key={row.companyId} className="grid grid-cols-[1fr_auto] gap-3 px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-[#dbe5d9]">{row.companyName}</p>
                    <p className="text-xs text-[#859585]">Paid {formatMoney(row.paid)} of {formatMoney(row.revenue)}</p>
                  </div>
                  <p className="font-mono text-sm font-semibold text-[#ffba79]">{formatMoney(row.receivable)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#262626] bg-[#161616]">
          <div className="border-b border-[#262626] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">
              Master payables
            </p>
          </div>
          {payables.length === 0 ? (
            <p className="px-5 py-6 text-sm text-[#859585]">No master balances.</p>
          ) : (
            <div className="divide-y divide-[#262626]">
              {payables.slice(0, 8).map((row) => (
                <div key={row.masterId} className="grid grid-cols-[1fr_auto] gap-3 px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-[#dbe5d9]">{row.masterName}</p>
                    <p className="text-xs text-[#859585]">Paid {formatMoney(row.paid)} of {formatMoney(row.earned)}</p>
                  </div>
                  <p className="font-mono text-sm font-semibold text-[#ffba79]">{formatMoney(row.payable)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[#262626] bg-[#161616]">
        <div className="border-b border-[#262626] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">
            Recent ledger entries
          </p>
        </div>
        {entries.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[#859585]">No ledger entries recorded.</p>
        ) : (
          <div className="divide-y divide-[#262626]">
            {entries.slice(0, 100).map((entry) => (
              <div key={entry.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1fr_1fr_auto]">
                <div>
                  <p className="text-sm font-medium capitalize text-[#dbe5d9]">{entryLabel(entry.entry_type)}</p>
                  {entry.description && <p className="mt-1 text-xs text-[#859585]">{entry.description}</p>}
                </div>
                <p className="text-sm text-[#859585]">{new Date(entry.entry_date).toLocaleDateString('en-GB')}</p>
                <p className="text-sm capitalize text-[#859585]">{entry.payment_method?.replaceAll('_', ' ') ?? 'No method'}</p>
                <p className={`font-mono text-sm font-semibold ${entry.direction === 'in' ? 'text-[#00e475]' : 'text-[#ffba79]'}`}>
                  {entry.direction === 'in' ? '+' : '-'}{formatMoney(entry.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
