// lib/auth/server.ts
import { SupabaseClient, User } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

export class AuthError extends Error {
  constructor(message = 'Akses ditolak.') {
    super(message)
    this.name = 'AuthError'
  }
}

export async function authorizeAdmin(
  supabase: SupabaseClient<Database>
): Promise<User> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new AuthError('Akses ditolak: Anda tidak terautentikasi.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    throw new Error(`Kesalahan database: ${profileError.message}`)
  }

  if (profile?.role !== 'admin') {
    throw new AuthError(
      'Akses ditolak: Hanya admin yang dapat melakukan aksi ini.'
    )
  }

  return user
}
