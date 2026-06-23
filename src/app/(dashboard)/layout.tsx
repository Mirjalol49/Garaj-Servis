import { requireAuth } from '@/lib/auth/utils'
import Link from 'next/link'
import { Car, Building2, Wrench, Users, Wallet, Settings, LogOut, LayoutDashboard } from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-muted/20 hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-lg font-bold tracking-tight">Car Service</h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium">
            <span className="w-5 h-5"><LayoutDashboard className="w-full h-full" /></span>
            Dashboard
          </Link>
          <Link href="/jobs" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium">
            <span className="w-5 h-5"><Wrench className="w-full h-full" /></span>
            Job Orders
          </Link>
          <Link href="/cars" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium">
            <span className="w-5 h-5"><Car className="w-full h-full" /></span>
            Cars
          </Link>
          <Link href="/companies" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium">
            <span className="w-5 h-5"><Building2 className="w-full h-full" /></span>
            Companies
          </Link>
          <Link href="/masters" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium">
            <span className="w-5 h-5"><Users className="w-full h-full" /></span>
            Masters
          </Link>
          <Link href="/finance" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium">
            <span className="w-5 h-5"><Wallet className="w-full h-full" /></span>
            Finance
          </Link>
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium">
            <span className="w-5 h-5"><Settings className="w-full h-full" /></span>
            Settings
          </Link>
        </nav>
        <div className="p-4 border-t">
          <form action={logout}>
            <button type="submit" className="flex w-full items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium text-muted-foreground transition-transform active:scale-[0.98]">
              <span className="w-5 h-5"><LogOut className="w-full h-full" /></span>
              Logout
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-background isolation-isolate">
        <div className="p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
