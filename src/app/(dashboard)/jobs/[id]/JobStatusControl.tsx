'use client'

import { useState, useTransition } from 'react'
import { updateJobStatus } from '../actions'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

const STATUS_FLOW: Record<string, string[]> = {
  opened: ['diagnosing', 'cancelled'],
  diagnosing: ['waiting_approval', 'in_progress', 'cancelled'],
  waiting_approval: ['in_progress', 'cancelled'],
  in_progress: ['ready', 'cancelled'],
  ready: ['delivered'],
  delivered: [],
  cancelled: [],
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

const STATUS_STYLES: Record<string, string> = {
  opened: 'bg-[#0068ed]/15 text-[#6eb3ff] border-[#0068ed]/30',
  diagnosing: 'bg-[#ffdec4]/10 text-[#ffba79] border-[#ffdec4]/20',
  waiting_approval: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  in_progress: 'bg-[#00e475]/10 text-[#00e475] border-[#00e475]/20',
  ready: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  delivered: 'bg-[#3b4a3d] text-[#859585] border-[#3b4a3d]',
  cancelled: 'bg-[#93000a]/15 text-[#ffb4ab] border-[#93000a]/30',
}

type JobStatus = 'opened' | 'diagnosing' | 'waiting_approval' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'

export default function JobStatusControl({
  jobId,
  currentStatus,
}: {
  jobId: string
  currentStatus: string
}) {
  const [status, setStatus] = useState(currentStatus)
  const [isPending, startTransition] = useTransition()

  const nextStatuses = STATUS_FLOW[status] ?? []

  function advance(next: JobStatus) {
    startTransition(async () => {
      const result = await updateJobStatus(jobId, next)
      if (!result?.error) setStatus(next)
    })
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[status]}`}>
        {STATUS_LABELS[status]}
      </span>
      {nextStatuses.map((next) => (
        <Button
          key={next}
          size="sm"
          variant={next === 'cancelled' ? 'destructive' : next === 'delivered' ? 'default' : 'outline'}
          disabled={isPending}
          onClick={() => advance(next as JobStatus)}
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          → {STATUS_LABELS[next]}
        </Button>
      ))}
    </div>
  )
}
