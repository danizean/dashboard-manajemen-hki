// middleware.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Buat respons yang akan kita modifikasi
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Buat Supabase client di dalam middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Middleware hanya boleh memodifikasi cookies pada 'response' yang keluar
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Middleware hanya boleh memodifikasi cookies pada 'response' yang keluar
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Perintah ini penting untuk menyegarkan sesi pengguna
  await supabase.auth.getUser()

  // Kembalikan 'response' yang sudah dimodifikasi (jika ada)
  return response
}

export const config = {
  matcher: [
    /*
     * Match semua path request kecuali untuk file-file statis:
     * - _next/static (file statis)
     * - _next/image (file optimasi gambar)
     * - favicon.ico (file favicon)
     * - file gambar lainnya
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}