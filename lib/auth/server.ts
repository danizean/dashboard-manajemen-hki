// lib/auth/server.ts
import { SupabaseClient, User } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

/**
 * Kelas Error kustom untuk membedakan error otorisasi
 * dengan error lainnya di blok try...catch.
 */
export class AuthError extends Error {
  constructor(message = 'Akses ditolak.') {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Helper terpusat untuk memverifikasi bahwa pengguna yang membuat request
 * sudah login dan memiliki peran 'admin'.
 * Melempar `AuthError` jika validasi gagal.
 */
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
