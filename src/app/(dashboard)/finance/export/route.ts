import { createClient } from '@/lib/supabase/server'
import {
  buildCompanyReceivablesReport,
  buildJobProfitabilityReport,
  buildMasterPayablesReport,
  type ReportJob,
} from '@/lib/finance/reports'

export const dynamic = 'force-dynamic'

function csvCell(value: string | number | null | undefined) {
  const stringValue = String(value ?? '')
  if (!/[",\n]/.test(stringValue)) return stringValue
  return `"${stringValue.replaceAll('"', '""')}"`
}

function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  return [
    headers.map(csvCell).join(','),
    ...rows.map((row) => row.map(csvCell).join(',')),
  ].join('\n')
}

function csvResponse(filename: string, body: string) {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}

function mapReportJobs(jobs: NonNullable<Awaited<ReturnType<typeof loadReportRows>>['jobs']>): ReportJob[] {
  return jobs.map((job) => {
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
}

async function loadReportRows() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { authorized: false as const }

  const [
    { data: jobs },
    { data: ledgerEntries },
    { data: companies },
    { data: masters },
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
    supabase
      .from('ledger_entries')
      .select('entry_type, direction, amount, payment_method, description, entry_date, job_order_id, customer_company_id, master_id')
      .order('entry_date', { ascending: false }),
    supabase.from('customer_companies').select('id, name').order('name'),
    supabase.from('masters').select('id, name').order('name'),
  ])

  return {
    authorized: true as const,
    jobs: jobs ?? [],
    ledgerEntries: ledgerEntries ?? [],
    companies: companies ?? [],
    masters: masters ?? [],
  }
}

export async function GET(request: Request) {
  const rows = await loadReportRows()
  if (!rows.authorized) return new Response('Unauthorized', { status: 401 })

  const report = new URL(request.url).searchParams.get('report') ?? 'ledger'
  const jobs = mapReportJobs(rows.jobs)

  if (report === 'job-profitability') {
    const data = buildJobProfitabilityReport(jobs)
    return csvResponse(
      'job-profitability.csv',
      toCsv(
        ['job_number', 'status', 'company', 'plate_number', 'revenue', 'master_cost', 'job_expenses', 'gross_profit', 'customer_paid', 'receivable', 'master_paid', 'master_payable'],
        data.map((job) => [
          job.jobNumber,
          job.status,
          job.companyName,
          job.plateNumber,
          job.customerRevenue,
          job.masterCost,
          job.jobExpenses,
          job.grossProfit,
          job.customerPayments,
          job.receivable,
          job.masterPayments,
          job.masterPayable,
        ])
      )
    )
  }

  if (report === 'company-receivables') {
    const data = buildCompanyReceivablesReport(jobs, rows.companies, rows.ledgerEntries)
    return csvResponse(
      'company-receivables.csv',
      toCsv(
        ['company', 'revenue', 'paid', 'receivable'],
        data.map((company) => [company.companyName, company.revenue, company.paid, company.receivable])
      )
    )
  }

  if (report === 'master-payables') {
    const data = buildMasterPayablesReport(jobs, rows.masters, rows.ledgerEntries)
    return csvResponse(
      'master-payables.csv',
      toCsv(
        ['master', 'earned', 'paid', 'payable'],
        data.map((master) => [master.masterName, master.earned, master.paid, master.payable])
      )
    )
  }

  return csvResponse(
    'ledger.csv',
    toCsv(
      ['date', 'entry_type', 'direction', 'amount', 'payment_method', 'description', 'job_order_id', 'customer_company_id', 'master_id'],
      rows.ledgerEntries.map((entry) => [
        entry.entry_date,
        entry.entry_type,
        entry.direction,
        entry.amount,
        entry.payment_method,
        entry.description,
        entry.job_order_id,
        entry.customer_company_id,
        entry.master_id,
      ])
    )
  )
}
