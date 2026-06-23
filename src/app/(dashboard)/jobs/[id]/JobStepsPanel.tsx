'use client'

import { useState, useTransition } from 'react'
import { addJobStep, deleteJobStep, updateStepStatus } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'

interface Master { id: string; name: string }
interface Step {
  id: string
  description: string
  status: string
  customer_price: number
  master_cost: number
  masters: { name: string } | null
}

const STEP_STATUS_STYLES: Record<string, string> = {
  pending: 'text-[#859585]',
  assigned: 'text-[#0068ed]',
  in_progress: 'text-[#00e475]',
  done: 'text-emerald-400',
  cancelled: 'text-[#ffb4ab]',
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('uz-UZ', { minimumFractionDigits: 0 }).format(n)
}

interface Props {
  jobId: string
  initialSteps: Step[]
  masters: Master[]
}

export default function JobStepsPanel({ jobId, initialSteps, masters }: Props) {
  const [steps, setSteps] = useState<Step[]>(initialSteps)
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAddStep(formData: FormData) {
    formData.set('job_order_id', jobId)
    setError(null)
    startTransition(async () => {
      const result = await addJobStep(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setShowForm(false)
        // Optimistic: just refresh via server revalidation
      }
    })
  }

  async function handleDelete(stepId: string) {
    startTransition(async () => {
      const result = await deleteJobStep(stepId, jobId)
      if (!result?.error) {
        setSteps((prev) => prev.filter((s) => s.id !== stepId))
      }
    })
  }

  async function handleStatusChange(stepId: string, status: string) {
    startTransition(async () => {
      await updateStepStatus(stepId, jobId, status)
    })
  }

  const totalRevenue = steps.reduce((sum, s) => sum + Number(s.customer_price), 0)
  const totalCost = steps.reduce((sum, s) => sum + Number(s.master_cost), 0)

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Revenue', value: formatMoney(totalRevenue), color: 'text-[#00e475]' },
          { label: 'Master Cost', value: formatMoney(totalCost), color: 'text-[#ffba79]' },
          { label: 'Step Profit', value: formatMoney(totalRevenue - totalCost), color: totalRevenue - totalCost >= 0 ? 'text-[#00e475]' : 'text-[#ffb4ab]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="px-4 py-3 rounded-xl bg-[#0d0d0d] border border-[#262626]">
            <p className="text-xs uppercase tracking-widest text-[#859585] font-[var(--font-geist)] mb-1">{label}</p>
            <p className={`text-lg font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-[#ffb4ab] bg-[#93000a]/20 border border-[#93000a]/30 px-3 py-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Steps table */}
      {steps.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Master</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {steps.map((step) => (
              <TableRow key={step.id}>
                <TableCell className="font-medium text-[#dbe5d9]">{step.description}</TableCell>
                <TableCell className="text-[#bacbb9]">{step.masters?.name ?? '—'}</TableCell>
                <TableCell>
                  <select
                    defaultValue={step.status}
                    onChange={(e) => handleStatusChange(step.id, e.target.value)}
                    className={`bg-transparent border-0 outline-none text-xs font-semibold cursor-pointer ${STEP_STATUS_STYLES[step.status]}`}
                  >
                    {['pending', 'assigned', 'in_progress', 'done', 'cancelled'].map((s) => (
                      <option key={s} value={s} className="bg-[#161616] text-[#dbe5d9]">
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell className="text-right text-[#00e475] font-mono text-xs">
                  {formatMoney(Number(step.customer_price))}
                </TableCell>
                <TableCell className="text-right text-[#ffba79] font-mono text-xs">
                  {formatMoney(Number(step.master_cost))}
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => handleDelete(step.id)}
                    disabled={isPending}
                    className="text-[#3b4a3d] hover:text-[#ffb4ab] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-[#859585] text-center py-6">No steps added yet.</p>
      )}

      {/* Add step form */}
      {showForm ? (
        <form action={handleAddStep} className="rounded-xl border border-[#0068ed]/30 bg-[#0068ed]/5 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">Add Step</p>
          <div className="space-y-1.5">
            <Label className="text-xs text-[#859585]">Description *</Label>
            <Input name="description" required placeholder="e.g. Replace brake pads" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#859585]">Assign Master</Label>
              <select
                name="assigned_master_id"
                className="h-9 w-full rounded-xl border border-[#262626] bg-[#0A0A0A] px-3 text-sm text-[#dbe5d9] outline-none focus:border-[#0068ed]"
              >
                <option value="">— Unassigned —</option>
                {masters.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#859585]">Customer Price</Label>
              <Input name="customer_price" type="number" min="0" step="0.01" defaultValue="0" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-[#859585]">Master Cost</Label>
            <Input name="master_cost" type="number" min="0" step="0.01" defaultValue="0" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={isPending} size="sm">
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add Step
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Add Step
        </Button>
      )}
    </div>
  )
}
