import Link from 'next/link'
import { ArrowRight, Banknote, Car, CircleDollarSign, ReceiptText, TrendingUp, Wallet, Wrench } from 'lucide-react'
import { requireAuth } from '@/lib/auth/utils'
import { createClient } from '@/lib/supabase/server'
import { buildCompanyReceivablesReport, buildFinanceSummary, buildMasterPayablesReport, type ReportJob } from '@/lib/finance/reports'

function formatMoney(n: number | string | null | undefined) {
  return new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 0 }).format(Number(n ?? 0))
}

function statusLabel(status: string) {
  return status.replaceAll('_', ' ')
}

export default async function DashboardPage() {
  await requireAuth()
  const supabase = await createClient()

  const [
    { data: jobs },
    { data: ledgerEntries },
    { data: companies },
    { data: masters },
    { count: carCount },
  ] = await Promise.all([
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
    supabase.from('ledger_entries').select('entry_type, direction, amount, job_order_id, customer_company_id, master_id'),
    supabase.from('customer_companies').select('id, name'),
    supabase.from('masters').select('id, name'),
    supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

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
  const summary = buildFinanceSummary(reportJobs, ledgerEntries ?? [])
  const receivables = buildCompanyReceivablesReport(reportJobs, companies ?? [], ledgerEntries ?? [])
  const payables = buildMasterPayablesReport(reportJobs, masters ?? [], ledgerEntries ?? [])
  const openJobs = reportJobs.filter((job) => !['delivered', 'cancelled'].includes(job.status)).length
  const readyJobs = reportJobs.filter((job) => job.status === 'ready').length
  const recentJobs = reportJobs.slice(0, 5)

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)] mb-1">
            Dashboard
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-[#dbe5d9]">Owner overview</h1>
        </div>
        <Link href="/finance" className="inline-flex items-center gap-2 rounded-xl border border-[#262626] px-3 py-2 text-sm text-[#dbe5d9] hover:border-[#00e475]/50 hover:text-[#00e475]">
          Finance
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: 'Income', value: summary.income, icon: CircleDollarSign, color: 'text-[#00e475]' },
          { label: 'Expense', value: summary.expense, icon: ReceiptText, color: 'text-[#ffba79]' },
          { label: 'Profit', value: summary.profit, icon: TrendingUp, color: summary.profit >= 0 ? 'text-[#00e475]' : 'text-[#ffb4ab]' },
          { label: 'Net Cashflow', value: summary.netCashflow, icon: Banknote, color: summary.netCashflow >= 0 ? 'text-[#00e475]' : 'text-[#ffb4ab]' },
          { label: 'Receivables', value: receivables.reduce((sum, row) => sum + row.receivable, 0), icon: Wallet, color: 'text-[#ffba79]' },
          { label: 'Payables', value: payables.reduce((sum, row) => sum + row.payable, 0), icon: Wallet, color: 'text-[#ffba79]' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-[#262626] bg-[#161616] p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`font-mono text-2xl font-semibold ${color}`}>{formatMoney(value)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: 'Open Jobs', value: openJobs, icon: Wrench },
          { label: 'Ready Jobs', value: readyJobs, icon: Wrench },
          { label: 'Active Cars', value: carCount ?? 0, icon: Car },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-4 rounded-2xl border border-[#262626] bg-[#161616] p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0d150e] text-[#00e475]">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">{label}</p>
              <p className="font-mono text-2xl font-semibold text-[#dbe5d9]">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#262626] bg-[#161616]">
          <div className="border-b border-[#262626] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">Recent jobs</p>
          </div>
          {recentJobs.length === 0 ? (
            <p className="px-5 py-6 text-sm text-[#859585]">No jobs yet.</p>
          ) : (
            <div className="divide-y divide-[#262626]">
              {recentJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="grid grid-cols-[1fr_auto] gap-3 px-5 py-4 hover:bg-[#1c1c1c]">
                  <div>
                    <p className="font-mono text-sm font-semibold text-[#dbe5d9]">{job.job_number}</p>
                    <p className="text-xs text-[#859585]">{[job.plate_number, job.company_name].filter(Boolean).join(' · ')}</p>
                  </div>
                  <p className="text-xs capitalize text-[#859585]">{statusLabel(job.status)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#262626] bg-[#161616]">
          <div className="border-b border-[#262626] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">Top receivables</p>
          </div>
          {receivables.length === 0 ? (
            <p className="px-5 py-6 text-sm text-[#859585]">No receivables yet.</p>
          ) : (
            <div className="divide-y divide-[#262626]">
              {receivables.slice(0, 5).map((row) => (
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
      </div>
    </div>
  )
}
