import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth/utils'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Wrench } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  opened: 'bg-[#0068ed]/15 text-[#6eb3ff] border border-[#0068ed]/30',
  diagnosing: 'bg-[#ffdec4]/10 text-[#ffba79] border border-[#ffdec4]/20',
  waiting_approval: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  in_progress: 'bg-[#00e475]/10 text-[#00e475] border border-[#00e475]/20',
  ready: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  delivered: 'bg-[#3b4a3d] text-[#859585] border border-[#3b4a3d]',
  cancelled: 'bg-[#93000a]/15 text-[#ffb4ab] border border-[#93000a]/30',
}

const STATUS_LABELS: Record<string, string> = {
  opened: 'Opened',
  diagnosing: 'Diagnosing',
  waiting_approval: 'Waiting Approval',
  in_progress: 'In Progress',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireAuth()
  const supabase = await createClient()
  const { status } = await searchParams

  let query = supabase
    .from('job_orders')
    .select(`
      id,
      job_number,
      status,
      opened_at,
      problem_description,
      cars ( plate_number, make, model ),
      customer_companies ( name )
    `)
    .order('opened_at', { ascending: false })
    .limit(100)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: jobs, error } = await query

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)] mb-1">
            Workshop
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-[#dbe5d9]">Job Orders</h1>
        </div>
        <Link href="/jobs/new">
          <Button size="default">
            <Plus className="w-4 h-4" />
            New Job
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 bg-[#161616] border border-[#262626] rounded-xl w-fit">
        {[
          { label: 'Active', value: 'active' },
          { label: 'All', value: 'all' },
          { label: 'Ready', value: 'ready' },
          { label: 'Delivered', value: 'delivered' },
          { label: 'Cancelled', value: 'cancelled' },
        ].map(({ label, value }) => {
          const isActive = (!status && value === 'active') || status === value
          return (
            <Link
              key={value}
              href={`/jobs?status=${value}`}
              className={[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#00e475] text-[#00210b]'
                  : 'text-[#859585] hover:text-[#dbe5d9] hover:bg-[#232c24]',
              ].join(' ')}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {/* Table */}
      {error ? (
        <p className="text-[#ffb4ab] text-sm">Failed to load jobs.</p>
      ) : jobs && jobs.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job #</TableHead>
              <TableHead>Car</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Problem</TableHead>
              <TableHead>Opened</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => {
              const car = Array.isArray(job.cars) ? job.cars[0] : job.cars
              const company = Array.isArray(job.customer_companies) ? job.customer_companies[0] : job.customer_companies
              return (
                <TableRow key={job.id}>
                  <TableCell>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-mono text-[#00e475] hover:underline text-xs font-semibold tracking-wider"
                    >
                      {job.job_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-[#dbe5d9]">{car?.plate_number}</span>
                    {car?.make && (
                      <span className="ml-2 text-[#859585] text-xs">{car.make} {car.model}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[#bacbb9]">{company?.name ?? '—'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[job.status] ?? ''}`}>
                      {STATUS_LABELS[job.status] ?? job.status}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-[#859585]">
                    {job.problem_description}
                  </TableCell>
                  <TableCell className="text-[#859585] text-xs">
                    {new Date(job.opened_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-[#3b4a3d] bg-[#0d0d0d]">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#161616] border border-[#262626] mb-4">
            <Wrench className="w-6 h-6 text-[#3b4a3d]" />
          </div>
          <p className="text-[#dbe5d9] font-semibold mb-1">No job orders yet</p>
          <p className="text-[#859585] text-sm mb-5">Open the first job to get started.</p>
          <Link href="/jobs/new">
            <Button>
              <Plus className="w-4 h-4" />
              New Job
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
