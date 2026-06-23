import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return user
}

export async function requireRole(allowedRoles: string[]) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Get profile role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/dashboard') 
  }

  return { user, profile }
}
