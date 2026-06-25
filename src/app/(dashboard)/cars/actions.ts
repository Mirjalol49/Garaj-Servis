'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

const carSchema = z.object({
  customer_company_id: z.string().uuid().nullable(),
  plate_number: z.string().min(2).toUpperCase().nullable(),
  car_name: z.string().max(120).nullable().optional(),
  vin: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  color: z.string().optional(),
  owner_phone: z.string().max(40).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  profile_image_path: z.string().nullable().optional(),
  current_odometer: z.number().int().min(0).optional(),
  status: z.string().default('active'),
})
type CarInput = z.input<typeof carSchema>
const optionalCarProfileColumns = ['car_name', 'owner_phone', 'notes', 'profile_image_path'] as const

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

async function uploadCarProfileImage(supabase: Awaited<ReturnType<typeof createClient>>, formData: FormData) {
  const file = formData.get('profile_image')
  if (!(file instanceof File) || file.size === 0) return null

  if (!file.type.startsWith('image/')) {
    throw new Error('Car profile image must be an image file.')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Car profile image must be smaller than 5MB.')
  }

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const storagePath = `cars/${randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from('car-photos')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) throw new Error(error.message)
  return storagePath
}

function buildRawCarData(formData: FormData, profileImagePath: string | null): CarInput | { error: string } {
  const rawPlate = getFormString(formData, 'plate_number')?.toUpperCase()
  const companyId = getFormString(formData, 'customer_company_id')
  const carName = getFormString(formData, 'car_name')
  const make = getFormString(formData, 'make')
  const model = getFormString(formData, 'model')
  const ownerPhone = getFormString(formData, 'owner_phone')

  if (!rawPlate && !carName && !make && !model && !ownerPhone && !profileImagePath) {
    return { error: 'Add at least a plate number, make, model, or profile image.' }
  }

  const rawData: CarInput = {
    customer_company_id: companyId === '__none' ? null : companyId ?? null,
    plate_number: rawPlate ?? null,
    status: (formData.get('status') as string) || 'active',
  }

  if (formData.has('car_name')) rawData.car_name = carName ?? null
  if (formData.has('owner_phone')) rawData.owner_phone = ownerPhone ?? null
  if (formData.has('notes')) rawData.notes = getFormString(formData, 'notes') ?? null
  if (profileImagePath) rawData.profile_image_path = profileImagePath

  const vin = getFormString(formData, 'vin')
  const color = getFormString(formData, 'color')
  const year = getFormString(formData, 'year')
  const currentOdometer = getFormString(formData, 'current_odometer')

  if (vin) rawData.vin = vin
  if (make) rawData.make = make
  if (model) rawData.model = model
  if (color) rawData.color = color
  if (year) rawData.year = parseInt(year, 10)
  if (currentOdometer) rawData.current_odometer = parseInt(currentOdometer, 10)

  return rawData
}

async function assertUniquePlate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  plate: string | null | undefined,
  currentCarId?: string
) {
  if (!plate) return null

  let query = supabase
    .from('cars')
    .select('id')
    .ilike('plate_number', plate)

  if (currentCarId) {
    query = query.neq('id', currentCarId)
  }

  const { data: existingCar } = await query.maybeSingle()
  return existingCar ? 'A car with this plate number already exists.' : null
}

function isMissingOptionalCarProfileColumn(error: { message?: string; code?: string }) {
  if (error.code !== 'PGRST204' && !error.message?.includes('schema cache')) return false
  return optionalCarProfileColumns.some((column) => error.message?.includes(`'${column}'`))
}

function withoutOptionalCarProfileColumns(data: z.output<typeof carSchema>) {
  const fallbackData = { ...data }
  for (const column of optionalCarProfileColumns) {
    delete fallbackData[column]
  }
  return fallbackData
}

export async function createCar(formData: FormData) {
  const supabase = await createClient()

  let profileImagePath: string | null = null
  try {
    profileImagePath = await uploadCarProfileImage(supabase, formData)
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to upload car profile image.' }
  }

  const rawData = buildRawCarData(formData, profileImagePath)
  if ('error' in rawData) return rawData

  const duplicateError = await assertUniquePlate(supabase, rawData.plate_number)
  if (duplicateError) return { error: duplicateError }

  const parsed = carSchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: 'Invalid car data provided.' }
  }

  const { error } = await supabase
    .from('cars')
    .insert([parsed.data])

  if (error) {
    if (isMissingOptionalCarProfileColumn(error)) {
      if (profileImagePath) {
        await supabase.storage.from('car-photos').remove([profileImagePath])
        return { error: 'Car image cannot be saved until the car profile database migration is applied.' }
      }

      const { error: fallbackError } = await supabase
        .from('cars')
        .insert([withoutOptionalCarProfileColumns(parsed.data)])

      if (!fallbackError) {
        if (profileImagePath) {
          await supabase.storage.from('car-photos').remove([profileImagePath])
        }
        revalidatePath('/cars')
        return { success: true }
      }
    }

    return { error: error.message }
  }

  revalidatePath('/cars')
  return { success: true }
}

export async function updateCar(carId: string, formData: FormData) {
  const supabase = await createClient()
  const existingImagePath = getFormString(formData, 'current_profile_image_path') ?? null

  let uploadedImagePath: string | null = null
  let profileImagePath = existingImagePath
  try {
    uploadedImagePath = await uploadCarProfileImage(supabase, formData)
    profileImagePath = uploadedImagePath ?? existingImagePath
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to upload car profile image.' }
  }

  const rawData = buildRawCarData(formData, profileImagePath)
  if ('error' in rawData) return rawData

  const duplicateError = await assertUniquePlate(supabase, rawData.plate_number, carId)
  if (duplicateError) return { error: duplicateError }

  const parsed = carSchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: 'Invalid car data provided.' }
  }

  const { error } = await supabase
    .from('cars')
    .update(parsed.data)
    .eq('id', carId)

  if (error) {
    if (isMissingOptionalCarProfileColumn(error)) {
      if (uploadedImagePath) {
        await supabase.storage.from('car-photos').remove([uploadedImagePath])
        return { error: 'Car image cannot be saved until the car profile database migration is applied.' }
      }

      const { error: fallbackError } = await supabase
        .from('cars')
        .update(withoutOptionalCarProfileColumns(parsed.data))
        .eq('id', carId)

      if (!fallbackError) {
        if (uploadedImagePath) {
          await supabase.storage.from('car-photos').remove([uploadedImagePath])
        }
        revalidatePath('/cars')
        revalidatePath(`/cars/${carId}`)
        return { success: true }
      }
    }

    return { error: error.message }
  }

  revalidatePath('/cars')
  revalidatePath(`/cars/${carId}`)
  return { success: true }
}

export async function deleteCar(carId: string) {
  const supabase = await createClient()
  const { data: car } = await supabase
    .from('cars')
    .select('profile_image_path')
    .eq('id', carId)
    .maybeSingle()

  const { error } = await supabase
    .from('cars')
    .delete()
    .eq('id', carId)

  if (error) {
    return {
      error: error.code === '23503'
        ? 'This car has job history and cannot be deleted.'
        : error.message,
    }
  }

  if (car?.profile_image_path) {
    await supabase.storage.from('car-photos').remove([car.profile_image_path])
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

export async function getCarProfileImageUrls(paths: string[]) {
  const supabase = await createClient()
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)))
  const entries = await Promise.all(
    uniquePaths.map(async (path) => {
      const { data } = await supabase.storage
        .from('car-photos')
        .createSignedUrl(path, 60 * 60)

      return [path, data?.signedUrl ?? null] as const
    })
  )

  return Object.fromEntries(entries)
}
