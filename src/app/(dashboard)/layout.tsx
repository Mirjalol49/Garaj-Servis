import { requireAuth } from '@/lib/auth/utils'
import Link from 'next/link'
import { headers } from 'next/headers'
import { Car, Building2, Wrench, Users, Wallet, Settings, LogOut, LayoutDashboard } from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Job Orders', icon: Wrench },
  { href: '/cars', label: 'Cars', icon: Car },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/masters', label: 'Masters', icon: Users },
  { href: '/finance', label: 'Finance', icon: Wallet },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 hidden md:flex flex-col border-r border-[#262626] bg-[#161616]">
        {/* Logo / Wordmark */}
        <div className="px-6 py-5 border-b border-[#262626]">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#00e475]">
              <Car className="w-4 h-4 text-[#00210b]" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-[#dbe5d9] font-[var(--font-geist)]">
              Garaj<span className="text-[#00e475]">Servis</span>
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[#0d150e] text-[#00e475]'
                    : 'text-[#859585] hover:bg-[#1c1c1c] hover:text-[#dbe5d9]',
                ].join(' ')}
              >
                {/* Active left-edge indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-[#00e475] shadow-[0_0_8px_rgba(0,228,117,0.6)]" />
                )}
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-[#262626]">
          <form action={logout}>
            <button
              type="submit"
              className="group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#859585] hover:bg-[#1c1c1c] hover:text-[#ffb4ab] transition-all duration-150 active:scale-[0.98]"
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
