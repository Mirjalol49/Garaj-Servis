'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const carSchema = z.object({
  customer_company_id: z.string().uuid(),
  plate_number: z.string().min(2).toUpperCase(),
  vin: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  color: z.string().optional(),
  current_odometer: z.number().int().min(0).optional(),
  status: z.string().default('active'),
})

export async function createCar(formData: FormData) {
  const supabase = await createClient()

  const rawPlate = formData.get('plate_number') as string
  if (rawPlate) {
    const { data: existingCar } = await supabase
      .from('cars')
      .select('id')
      .ilike('plate_number', rawPlate)
      .single()
      
    if (existingCar) {
      return { error: 'A car with this plate number already exists.' }
    }
  }

  const rawData: Record<string, any> = {
    customer_company_id: formData.get('customer_company_id') as string,
    plate_number: rawPlate,
    status: (formData.get('status') as string) || 'active',
  }

  if (formData.get('vin')) rawData.vin = formData.get('vin')
  if (formData.get('make')) rawData.make = formData.get('make')
  if (formData.get('model')) rawData.model = formData.get('model')
  if (formData.get('color')) rawData.color = formData.get('color')
  if (formData.get('year')) rawData.year = parseInt(formData.get('year') as string, 10)
  if (formData.get('current_odometer')) rawData.current_odometer = parseInt(formData.get('current_odometer') as string, 10)

  const parsed = carSchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: 'Invalid car data provided.' }
  }

  const { error } = await supabase
    .from('cars')
    .insert([parsed.data])

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/cars')
  return { success: true }
}

export async function getCars() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cars')
    .select(`
      *,
      customer_companies ( name )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}
