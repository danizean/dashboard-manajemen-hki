import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/database.types'

/**
 * ✅ Utility untuk membuat Supabase client di Server Component, API Routes, atau Server Actions.
 * Pastikan variabel environment sudah terdefinisi di .env.local
 */
export function createClient(cookieStore: ReturnType<typeof cookies>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      '❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables.'
    )
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          console.warn(`⚠️ Failed to set cookie "${name}":`, error)
          // Dibiarkan kosong jika tidak bisa set cookie (misalnya di Route Handler)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({
            name,
            value: '',
            ...options,
            maxAge: 0, // Hapus cookie dengan benar
          })
        } catch (error) {
          console.warn(`⚠️ Failed to remove cookie "${name}":`, error)
        }
      },
    },
  })
}
