'use client'

import { useState } from 'react'
import { createCompany } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

export function CreateCompanyForm() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    const result = await createCompany(formData)
    setIsLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Company created successfully')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="transition-transform active:scale-[0.98]" />}>
        Add Company
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Customer Company</DialogTitle>
          <DialogDescription>
            Register a new customer fleet or individual owner to the workshop.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name</Label>
            <Input id="name" name="name" required disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_person">Contact Person</Label>
            <Input id="contact_person" name="contact_person" disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" name="phone" disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billing_terms">Billing Terms</Label>
            <Input id="billing_terms" name="billing_terms" placeholder="e.g. Net 30" disabled={isLoading} />
          </div>
          <input type="hidden" name="active" value="true" />
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating...' : 'Create Company'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
