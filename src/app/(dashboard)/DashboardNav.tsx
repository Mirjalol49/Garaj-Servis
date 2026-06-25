'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Car, LayoutDashboard, Settings, Users, Wallet, Wrench } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Job Orders', icon: Wrench },
  { href: '/cars', label: 'Cars', icon: Car },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/masters', label: 'Masters', icon: Users },
  { href: '/finance', label: 'Finance', icon: Wallet },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`)

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={[
              'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm dark:bg-primary/10 dark:text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            ].join(' ')}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
