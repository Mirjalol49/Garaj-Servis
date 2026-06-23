import { requireAuth } from '@/lib/auth/utils'
import NewJobForm from './NewJobForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function NewJobPage() {
  await requireAuth()

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs text-[#859585] hover:text-[#dbe5d9] transition-colors mb-4"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to Jobs
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)] mb-1">
          Workshop
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-[#dbe5d9]">New Job Order</h1>
        <p className="text-sm text-[#859585] mt-1">Search for a car and describe the issue to open a new job.</p>
      </div>

      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-6">
        <NewJobForm />
      </div>
    </div>
  )
}
