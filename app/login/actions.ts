'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { getSupabaseAdmin } from '../../lib/supabaseAdmin'

export async function login(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const contactRaw = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!contactRaw || !password) {
    return { error: 'Email/WhatsApp dan password wajib diisi.' }
  }

  // Convert phone number to email format
  const email = contactRaw.includes('@')
    ? contactRaw
    : `${contactRaw}@student.mylms.app`

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Login gagal. Periksa kembali email/nomor dan password kamu.' }
  }

  // Check role from profiles
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    revalidatePath('/', 'layout')
    if (profile?.role === 'student') {
      redirect('/student')
    }
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}
