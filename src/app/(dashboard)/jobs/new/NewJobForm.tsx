'use client'

import { useState, useTransition } from 'react'
import { createJob } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Search, Car, Building2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CarResult {
  id: string
  plate_number: string
  make: string | null
  model: string | null
  year: number | null
  color: string | null
  customer_companies: { name: string } | null
}

type CarSearchRow = Omit<CarResult, 'customer_companies'> & {
  customer_companies: { name: string } | { name: string }[] | null
}

export default function NewJobForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [plate, setPlate] = useState('')
  const [searching, setSearching] = useState(false)
  const [selectedCar, setSelectedCar] = useState<CarResult | null>(null)
  const [searchResults, setSearchResults] = useState<CarResult[]>([])

  async function searchCar() {
    if (!plate.trim()) return
    setSearching(true)
    setSearchResults([])
    setSelectedCar(null)
    const supabase = createClient()
    const { data } = await supabase
      .from('cars')
      .select('id, plate_number, make, model, year, color, customer_companies(name)')
      .ilike('plate_number', `%${plate.trim()}%`)
      .limit(5)
    const rows = ((data ?? []) as unknown as CarSearchRow[]).map((car) => ({
      ...car,
      customer_companies: Array.isArray(car.customer_companies)
        ? car.customer_companies[0] ?? null
        : car.customer_companies,
    }))
    setSearchResults(rows)
    setSearching(false)
  }

  async function handleSubmit(formData: FormData) {
    if (!selectedCar) {
      setError('Please search and select a car first.')
      return
    }
    setError(null)
    formData.set('car_id', selectedCar.id)
    startTransition(async () => {
      const result = await createJob(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2.5 text-sm text-[#ffb4ab] bg-[#93000a]/20 border border-[#93000a]/30 px-3 py-2.5 rounded-xl">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Car search */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">
          Search Car by Plate Number
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. 01A123BB"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchCar())}
            className="font-mono tracking-widest"
          />
          <Button type="button" onClick={searchCar} disabled={searching} variant="outline">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && !selectedCar && (
          <div className="border border-[#262626] rounded-xl overflow-hidden">
            {searchResults.map((car) => (
              <button
                key={car.id}
                type="button"
                onClick={() => { setSelectedCar(car); setSearchResults([]) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#1c1c1c] transition-colors border-b border-[#262626] last:border-0"
              >
                <Car className="w-4 h-4 text-[#00e475] shrink-0" />
                <div>
                  <p className="font-mono font-semibold text-[#dbe5d9] tracking-wider">{car.plate_number}</p>
                  <p className="text-xs text-[#859585]">
                    {[car.year, car.make, car.model, car.color].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {car.customer_companies && (
                  <span className="ml-auto text-xs text-[#859585] flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {car.customer_companies.name}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {searchResults.length === 0 && plate && !searching && !selectedCar && (
          <p className="text-xs text-[#859585]">No cars found for &quot;{plate}&quot;</p>
        )}

        {/* Selected car */}
        {selectedCar && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#00e475]/5 border border-[#00e475]/20">
            <Car className="w-4 h-4 text-[#00e475] shrink-0" />
            <div className="flex-1">
              <p className="font-mono font-semibold text-[#00e475] tracking-wider">{selectedCar.plate_number}</p>
              <p className="text-xs text-[#859585]">
                {[selectedCar.year, selectedCar.make, selectedCar.model].filter(Boolean).join(' ')}
                {selectedCar.customer_companies && ` · ${selectedCar.customer_companies.name}`}
              </p>
            </div>
            <button type="button" onClick={() => setSelectedCar(null)} className="text-xs text-[#859585] hover:text-[#ffb4ab]">Change</button>
          </div>
        )}
      </div>

      {/* Hidden car_id */}
      <input type="hidden" name="car_id" value={selectedCar?.id ?? ''} />

      {/* Odometer */}
      <div className="space-y-1.5">
        <Label htmlFor="intake_odometer" className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">
          Intake Odometer (km)
        </Label>
        <Input
          id="intake_odometer"
          name="intake_odometer"
          type="number"
          min="0"
          placeholder="e.g. 45000"
          disabled={isPending}
        />
      </div>

      {/* Problem description */}
      <div className="space-y-1.5">
        <Label htmlFor="problem_description" className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">
          Problem Description <span className="text-[#ffb4ab]">*</span>
        </Label>
        <textarea
          id="problem_description"
          name="problem_description"
          rows={3}
          required
          disabled={isPending}
          placeholder="Describe the customer complaint or issue..."
          className="w-full rounded-xl border border-[#262626] bg-[#0A0A0A] px-3 py-2 text-sm text-[#dbe5d9] placeholder:text-[#859585] resize-none transition-all duration-200 outline-none focus-visible:border-[#0068ed] focus-visible:shadow-[0_0_0_2px_rgba(0,104,237,0.2)]"
        />
      </div>

      {/* Internal notes */}
      <div className="space-y-1.5">
        <Label htmlFor="internal_notes" className="text-xs font-semibold uppercase tracking-widest text-[#859585] font-[var(--font-geist)]">
          Internal Notes
        </Label>
        <textarea
          id="internal_notes"
          name="internal_notes"
          rows={2}
          disabled={isPending}
          placeholder="Private workshop notes (not shown to customer)..."
          className="w-full rounded-xl border border-[#262626] bg-[#0A0A0A] px-3 py-2 text-sm text-[#dbe5d9] placeholder:text-[#859585] resize-none transition-all duration-200 outline-none focus-visible:border-[#0068ed] focus-visible:shadow-[0_0_0_2px_rgba(0,104,237,0.2)]"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending || !selectedCar} size="lg" className="flex-1">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isPending ? 'Creating Job…' : 'Create Job Order'}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
