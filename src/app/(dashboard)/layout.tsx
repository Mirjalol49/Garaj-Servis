import { Car, LogOut } from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'
import { ThemeToggle } from '@/components/theme-toggle'
import { DashboardNav } from './DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 hidden md:flex flex-col border-r border-border bg-sidebar">
        {/* Logo / Wordmark */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary">
              <Car className="w-4 h-4 text-primary-foreground" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground font-[var(--font-geist)]">
              Garaj<span className="text-primary">Servis</span>
            </span>
          </div>
        </div>

        <DashboardNav />

        {/* Logout */}
        <div className="space-y-2 px-3 pt-4 pb-12 border-t border-border">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground font-[var(--font-geist)]">
              Theme
            </span>
            <ThemeToggle />
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-destructive transition-all duration-150 active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto isolate">
        <div className="p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
