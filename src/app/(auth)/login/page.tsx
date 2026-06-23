'use client'

import { useState } from 'react'
import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Car } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [phone, setPhone] = useState('')

  function sanitizePhone(value: string) {
    return value.replace(/\D/g, '').slice(0, 15)
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
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-4">
      {/* Ambient glow behind card */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-96 h-96 rounded-full bg-[#00e475]/[0.03] blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl border border-[#262626] bg-[#161616] shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Top accent line */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#00e475]/40 to-transparent" />

          <div className="p-8">
            {/* Logo */}
            <div className="mb-8 flex flex-col items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#00e475]/10 border border-[#00e475]/20">
                <Car className="w-6 h-6 text-[#00e475]" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-semibold tracking-tight text-[#dbe5d9]">
                  Garaj<span className="text-[#00e475]">Servis</span>
                </h1>
                <p className="mt-1 text-xs font-medium uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">
                  Workshop Management
                </p>
              </div>
            </div>

            <form action={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2.5 text-sm text-[#ffb4ab] bg-[#93000a]/20 border border-[#93000a]/30 px-3 py-2.5 rounded-xl">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label
                  htmlFor="phone"
                  className="text-xs font-medium uppercase tracking-widest text-[#859585] font-[var(--font-geist)]"
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
                  onValueChange={(value) => setPhone(sanitizePhone(value))}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-xs font-medium uppercase tracking-widest text-[#859585] font-[var(--font-geist)]"
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

        <p className="mt-4 text-center text-xs text-[#3b4a3d]">
          Authorized personnel only
        </p>
      </div>
    </div>
  )
}
