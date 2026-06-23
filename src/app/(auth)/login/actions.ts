'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const loginSchema = z.object({
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ''))
    .refine((value) => value.length >= 7 && value.length <= 15),
  password: z.string().min(6),
})

function phoneToLoginEmail(phone: string) {
  return `${phone}@garaj-servis.local`
}

export async function login(formData: FormData) {
  const phone = String(formData.get('phone') ?? '')
  const password = String(formData.get('password') ?? '')

  const parsed = loginSchema.safeParse({ phone, password })
  if (!parsed.success) {
    return { error: 'Invalid phone number or password format.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: phoneToLoginEmail(parsed.data.phone),
    password: parsed.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
