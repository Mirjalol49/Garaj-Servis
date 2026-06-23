'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const companySchema = z.object({
  name: z.string().min(2),
  company_type: z.string().default('fleet'),
  phone: z.string().optional(),
  contact_person: z.string().optional(),
  billing_terms: z.string().optional(),
  active: z.boolean().default(true),
})

export async function createCompany(formData: FormData) {
  const supabase = await createClient()
  
  const rawData = {
    name: formData.get('name') as string,
    company_type: (formData.get('company_type') as string) || 'fleet',
    phone: formData.get('phone') as string,
    contact_person: formData.get('contact_person') as string,
    billing_terms: formData.get('billing_terms') as string,
    active: formData.get('active') === 'on' || formData.get('active') === 'true',
  }

  const parsed = companySchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: 'Invalid company data' }
  }

  const { error } = await supabase
    .from('customer_companies')
    .insert([parsed.data])

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/companies')
  return { success: true }
}

export async function getCompanies() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customer_companies')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}
