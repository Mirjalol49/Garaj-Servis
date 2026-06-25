import NewJobForm from './NewJobForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function NewJobPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to Jobs
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-[var(--font-geist)] mb-1">
          Workshop
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">New Job Order</h1>
        <p className="text-sm text-muted-foreground mt-1">Search for a car and describe the issue to open a new job.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <NewJobForm />
      </div>
    </div>
  )
}
