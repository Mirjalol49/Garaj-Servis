const SKELETON_CARDS = Array.from({ length: 6 }, (_, index) => index)

export default function DashboardLoading() {
  return (
    <div className="max-w-6xl space-y-6" aria-label="Loading section">
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-muted" />
        <div className="h-8 w-64 rounded-lg bg-muted" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {SKELETON_CARDS.map((index) => (
          <div key={index} className="h-28 rounded-2xl border border-border bg-card p-5">
            <div className="mb-5 h-3 w-20 rounded-full bg-muted" />
            <div className="h-7 w-28 rounded-lg bg-muted" />
          </div>
        ))}
      </div>

      <div className="h-72 rounded-2xl border border-border bg-card p-5">
        <div className="mb-5 h-3 w-32 rounded-full bg-muted" />
        <div className="space-y-3">
          <div className="h-4 rounded-full bg-muted" />
          <div className="h-4 w-11/12 rounded-full bg-muted" />
          <div className="h-4 w-4/5 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  )
}
