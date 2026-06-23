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
type CarInput = z.input<typeof carSchema>

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

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

  const rawData: CarInput = {
    customer_company_id: formData.get('customer_company_id') as string,
    plate_number: rawPlate,
    status: (formData.get('status') as string) || 'active',
  }

  const vin = getFormString(formData, 'vin')
  const make = getFormString(formData, 'make')
  const model = getFormString(formData, 'model')
  const color = getFormString(formData, 'color')
  const year = getFormString(formData, 'year')
  const currentOdometer = getFormString(formData, 'current_odometer')

  if (vin) rawData.vin = vin
  if (make) rawData.make = make
  if (model) rawData.model = model
  if (color) rawData.color = color
  if (year) rawData.year = parseInt(year, 10)
  if (currentOdometer) rawData.current_odometer = parseInt(currentOdometer, 10)

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
