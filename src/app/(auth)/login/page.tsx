'use client'

import { type ChangeEvent, type KeyboardEvent, useState } from 'react'
import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'
import { AlertCircle, Car } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [phone, setPhone] = useState('')

  function sanitizePhone(value: string) {
    return value.replace(/\D/g, '').slice(0, 15)
  }

  function handlePhoneInput(event: ChangeEvent<HTMLInputElement>) {
    const nextPhone = sanitizePhone(event.currentTarget.value)
    event.currentTarget.value = nextPhone
    setPhone(nextPhone)
  }

  function handlePhoneKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key.length === 1 && /\D/.test(event.key)) {
      event.preventDefault()
    }
  }

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      {/* Ambient glow behind card */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-96 h-96 rounded-full bg-primary/[0.03] blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl border border-border bg-card shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Top accent line */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="p-8">
            {/* Logo */}
            <div className="mb-8 flex flex-col items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  Garaj<span className="text-primary">Servis</span>
                </h1>
                <p className="mt-1 text-xs font-medium uppercase tracking-widest text-muted-foreground font-[var(--font-geist)]">
                  Workshop Management
                </p>
              </div>
            </div>

            <form action={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2.5 text-sm text-destructive bg-destructive/10 border border-destructive/30 px-3 py-2.5 rounded-xl">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label
                  htmlFor="phone"
                  className="text-xs font-medium uppercase tracking-widest text-muted-foreground font-[var(--font-geist)]"
                >
                  Phone number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="937489141"
                  value={phone}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  autoComplete="off"
                  disabled={isLoading}
                  onChange={handlePhoneInput}
                  onKeyDown={handlePhoneKeyDown}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-xs font-medium uppercase tracking-widest text-muted-foreground font-[var(--font-geist)]"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>

              <Button
                className="w-full mt-2"
                type="submit"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Authorized personnel only
        </p>
      </div>
    </div>
  )
}
