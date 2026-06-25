'use client'

import { useState, type ReactNode } from 'react'
import { createCar, updateCar } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'

export type CompanyOption = {
  id: string
  name: string
}

export type CarFormValue = {
  id: string
  customer_company_id: string | null
  car_name: string | null
  profile_image_url?: string | null
  plate_number: string | null
  owner_phone: string | null
  make: string | null
  model: string | null
  year: number | null
  current_odometer: number | null
  notes: string | null
  profile_image_path: string | null
}

type CreateCarFormProps = {
  companies: CompanyOption[]
  car?: CarFormValue
  trigger?: ReactNode
  triggerLabel?: string
  triggerClassName?: string
}

export function CreateCarForm({ companies, car, trigger, triggerLabel, triggerClassName }: CreateCarFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(car?.profile_image_url ?? null)
  const isEditing = Boolean(car)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    const result = car ? await updateCar(car.id, formData) : await createCar(formData)
    setIsLoading(false)

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else {
      toast.success(isEditing ? 'Car updated successfully' : 'Car created successfully')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className={triggerClassName ?? 'transition-transform active:scale-[0.98]'} />}>
        {trigger ?? triggerLabel ?? 'Add Car'}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Car' : 'Add New Car'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the vehicle details.' : 'Add a vehicle to the workshop list.'}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-6 mt-2">
          <input type="hidden" name="current_profile_image_path" value={car?.profile_image_path ?? ''} />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div
              className="relative flex h-24 w-32 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/50 bg-cover bg-center group transition-colors hover:bg-muted"
              style={imagePreview ? { backgroundImage: `url("${imagePreview}")` } : undefined}
            >
              {!imagePreview && (
                <Camera className="h-8 w-8 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-white font-medium">Upload Image</span>
              </div>
              <Input
                id="profile_image"
                name="profile_image"
                type="file"
                accept="image/*"
                className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                disabled={isLoading}
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plate_number">Plate Number</Label>
              <Input id="plate_number" name="plate_number" disabled={isLoading} className="uppercase" placeholder="01 A 123 BB" defaultValue={car?.plate_number ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_company_id">Customer Company</Label>
              <Select name="customer_company_id" disabled={isLoading} defaultValue={car?.customer_company_id ?? '__none'}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No company</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input id="make" name="make" disabled={isLoading} defaultValue={car?.make ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" name="model" disabled={isLoading} defaultValue={car?.model ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input id="year" name="year" type="number" min={1900} max={2100} disabled={isLoading} defaultValue={car?.year ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_odometer">Odometer</Label>
              <Input id="current_odometer" name="current_odometer" type="number" min={0} disabled={isLoading} defaultValue={car?.current_odometer ?? ''} />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Car')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
