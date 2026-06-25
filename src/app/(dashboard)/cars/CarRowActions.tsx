'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { deleteCar } from './actions'
import { CreateCarForm, type CarFormValue, type CompanyOption } from './CreateCarForm'

export function CarRowActions({
  car,
  companies,
}: {
  car: CarFormValue
  companies: CompanyOption[]
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const carLabel = car.car_name || car.plate_number || 'this car'

  async function handleDelete() {
    if (!window.confirm(`Delete ${carLabel}? This cannot be undone.`)) return

    setIsDeleting(true)
    const result = await deleteCar(car.id)
    setIsDeleting(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Car deleted successfully')
    }
  }

  return (
    <div className="flex justify-end gap-1">
      <CreateCarForm
        companies={companies}
        car={car}
        trigger={
          <>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </>
        }
        triggerClassName="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-semibold whitespace-nowrap text-muted-foreground hover:bg-accent hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={isDeleting}
        onClick={handleDelete}
        className="h-8 gap-1.5 rounded-md px-2.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {isDeleting ? 'Deleting' : 'Delete'}
      </Button>
    </div>
  )
}
