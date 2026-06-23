'use client'

import { useState } from 'react'
import { createCar } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type CompanyOption = {
  id: string
  name: string
}

export function CreateCarForm({ companies }: { companies: CompanyOption[] }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    const result = await createCar(formData)
    setIsLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Car created successfully')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="transition-transform active:scale-[0.98]" />}>
        Add Car
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Car</DialogTitle>
          <DialogDescription>
            Register a car and assign it to a customer company.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="customer_company_id">Customer Company</Label>
            <Select name="customer_company_id" required disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="plate_number">Plate Number</Label>
            <Input id="plate_number" name="plate_number" required disabled={isLoading} className="uppercase" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input id="make" name="make" disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" name="model" disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input id="year" name="year" type="number" min={1900} max={2100} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_odometer">Odometer</Label>
              <Input id="current_odometer" name="current_odometer" type="number" min={0} disabled={isLoading} />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating...' : 'Create Car'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
