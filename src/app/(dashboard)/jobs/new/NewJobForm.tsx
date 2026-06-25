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
  car_name: string | null
  plate_number: string | null
  make: string | null
  model: string | null
  year: number | null
  color: string | null
  owner_phone: string | null
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
    const term = plate.trim()
    setSearching(true)
    setSearchResults([])
    setSelectedCar(null)
    const supabase = createClient()
    const { data } = await supabase
      .from('cars')
      .select('id, car_name, plate_number, make, model, year, color, owner_phone, customer_companies(name)')
      .or(`plate_number.ilike.%${term}%,car_name.ilike.%${term}%,owner_phone.ilike.%${term}%`)
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
        <div className="flex items-center gap-2.5 text-sm text-destructive bg-destructive/10 border border-destructive/30 px-3 py-2.5 rounded-xl">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Car search */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-[var(--font-geist)]">
          Search Car by Plate, Name, or Owner Phone
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. 01A123BB, Malibu, +998..."
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchCar())}
          />
          <Button type="button" onClick={searchCar} disabled={searching} variant="outline">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && !selectedCar && (
          <div className="border border-border rounded-xl overflow-hidden">
            {searchResults.map((car) => (
              <button
                key={car.id}
                type="button"
                onClick={() => { setSelectedCar(car); setSearchResults([]) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0"
              >
                <Car className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">{car.car_name || car.plate_number || 'Unnamed car'}</p>
                  <p className="text-xs text-muted-foreground">
                    {[car.plate_number, car.year, car.make, car.model, car.owner_phone].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {car.customer_companies && (
                  <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {car.customer_companies.name}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {searchResults.length === 0 && plate && !searching && !selectedCar && (
          <p className="text-xs text-muted-foreground">No cars found for &quot;{plate}&quot;</p>
        )}

        {/* Selected car */}
        {selectedCar && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
            <Car className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-primary">{selectedCar.car_name || selectedCar.plate_number || 'Unnamed car'}</p>
              <p className="text-xs text-muted-foreground">
                {[selectedCar.plate_number, selectedCar.year, selectedCar.make, selectedCar.model].filter(Boolean).join(' · ')}
                {selectedCar.customer_companies && ` · ${selectedCar.customer_companies.name}`}
              </p>
            </div>
            <button type="button" onClick={() => setSelectedCar(null)} className="text-xs text-muted-foreground hover:text-destructive">Change</button>
          </div>
        )}
      </div>

      {/* Hidden car_id */}
      <input type="hidden" name="car_id" value={selectedCar?.id ?? ''} />

      {/* Odometer */}
      <div className="space-y-1.5">
        <Label htmlFor="intake_odometer" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-[var(--font-geist)]">
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
        <Label htmlFor="problem_description" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-[var(--font-geist)]">
          Problem Description <span className="text-destructive">*</span>
        </Label>
        <textarea
          id="problem_description"
          name="problem_description"
          rows={3}
          required
          disabled={isPending}
          placeholder="Describe the customer complaint or issue..."
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none transition-all duration-200 outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_2px_rgba(0,230,118,0.15)]"
        />
      </div>

      {/* Internal notes */}
      <div className="space-y-1.5">
        <Label htmlFor="internal_notes" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-[var(--font-geist)]">
          Internal Notes
        </Label>
        <textarea
          id="internal_notes"
          name="internal_notes"
          rows={2}
          disabled={isPending}
          placeholder="Private workshop notes (not shown to customer)..."
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none transition-all duration-200 outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_2px_rgba(0,230,118,0.15)]"
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
