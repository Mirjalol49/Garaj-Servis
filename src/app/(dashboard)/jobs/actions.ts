'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ─── Job number generation ────────────────────────────────────────────────────
async function generateJobNumber(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const prefix = `JOB-${year}${month}-`

  const { count } = await supabase
    .from('job_orders')
    .select('*', { count: 'exact', head: true })
    .like('job_number', `${prefix}%`)

  const seq = String((count ?? 0) + 1).padStart(4, '0')
  return `${prefix}${seq}`
}

// ─── Create Job ───────────────────────────────────────────────────────────────
const createJobSchema = z.object({
  car_id: z.string().uuid('Please select a valid car.'),
  intake_odometer: z.coerce.number().int().nonnegative().optional(),
  problem_description: z.string().min(1, 'Problem description is required.'),
  internal_notes: z.string().optional(),
})

export async function createJob(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = createJobSchema.safeParse({
    car_id: formData.get('car_id'),
    intake_odometer: formData.get('intake_odometer') || undefined,
    problem_description: formData.get('problem_description'),
    internal_notes: formData.get('internal_notes') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Get car to copy company_id
  const { data: car, error: carError } = await supabase
    .from('cars')
    .select('customer_company_id')
    .eq('id', parsed.data.car_id)
    .single()

  if (carError || !car) return { error: 'Car not found.' }

  const jobNumber = await generateJobNumber(supabase)

  const { data: job, error } = await supabase
    .from('job_orders')
    .insert({
      job_number: jobNumber,
      car_id: parsed.data.car_id,
      customer_company_id: car.customer_company_id,
      intake_odometer: parsed.data.intake_odometer ?? null,
      problem_description: parsed.data.problem_description,
      internal_notes: parsed.data.internal_notes ?? null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/jobs')
  redirect(`/jobs/${job.id}`)
}

// ─── Update Job Status ────────────────────────────────────────────────────────
const JOB_STATUSES = ['opened', 'diagnosing', 'waiting_approval', 'in_progress', 'ready', 'delivered', 'cancelled'] as const
type JobStatus = typeof JOB_STATUSES[number]

export async function updateJobStatus(jobId: string, status: JobStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  if (!JOB_STATUSES.includes(status)) return { error: 'Invalid job status' }

  const updates: Record<string, unknown> = { status }
  if (status === 'delivered') updates.closed_at = new Date().toISOString()

  const { error } = await supabase
    .from('job_orders')
    .update(updates)
    .eq('id', jobId)

  if (error) return { error: error.message }
  revalidatePath(`/jobs/${jobId}`)
  return { success: true }
}

// ─── Add Job Step ─────────────────────────────────────────────────────────────
const addStepSchema = z.object({
  job_order_id: z.string().uuid(),
  description: z.string().min(1, 'Description is required.'),
  assigned_master_id: z.string().uuid().nullable().optional(),
  customer_price: z.coerce.number().nonnegative().default(0),
  master_cost: z.coerce.number().nonnegative().default(0),
})

export async function addJobStep(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = addStepSchema.safeParse({
    job_order_id: formData.get('job_order_id'),
    description: formData.get('description'),
    assigned_master_id: formData.get('assigned_master_id') || null,
    customer_price: formData.get('customer_price'),
    master_cost: formData.get('master_cost'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const status = parsed.data.assigned_master_id ? 'assigned' : 'pending'

  const { error } = await supabase.from('job_steps').insert({
    ...parsed.data,
    status,
  })

  if (error) return { error: error.message }
  revalidatePath(`/jobs/${parsed.data.job_order_id}`)
  return { success: true }
}

// ─── Update Step Status ───────────────────────────────────────────────────────
export async function updateStepStatus(stepId: string, jobId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const updates: Record<string, unknown> = { status }
  if (status === 'in_progress') updates.started_at = new Date().toISOString()
  if (status === 'done') updates.completed_at = new Date().toISOString()

  const { error } = await supabase.from('job_steps').update(updates).eq('id', stepId)
  if (error) return { error: error.message }
  revalidatePath(`/jobs/${jobId}`)
  return { success: true }
}

// ─── Delete Step ──────────────────────────────────────────────────────────────
export async function deleteJobStep(stepId: string, jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('job_steps').delete().eq('id', stepId)
  if (error) return { error: error.message }
  revalidatePath(`/jobs/${jobId}`)
  return { success: true }
}

// ─── Add Issue ────────────────────────────────────────────────────────────────
const addIssueSchema = z.object({
  job_order_id: z.string().uuid(),
  title: z.string().min(1, 'Issue title is required.'),
  description: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high']).optional(),
})

export async function addJobIssue(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = addIssueSchema.safeParse({
    job_order_id: formData.get('job_order_id'),
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    severity: formData.get('severity') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('job_issues').insert(parsed.data)
  if (error) return { error: error.message }
  revalidatePath(`/jobs/${parsed.data.job_order_id}`)
  return { success: true }
}
