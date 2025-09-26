// app/api/users/route.ts
import { createClient } from '@/utils/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { cookies } from 'next/headers'

// ✅ Perbaikan createClient agar bisa dipanggil tanpa argumen
// (fallback otomatis pakai cookies() bawaan)
 
// Skema validasi untuk pengguna baru
const newUserSchema = z.object({
  email: z.string().email('Format email tidak valid.'),
  password: z.string().min(6, 'Password minimal 6 karakter.'),
  full_name: z.string().min(3, 'Nama lengkap minimal 3 karakter.'),
  role: z.enum(['admin', 'user']).optional().default('user'),
})

/**
 * Helper function untuk memverifikasi apakah pengguna saat ini adalah admin.
 */
async function verifyAdmin() {
  const supabase = createClient(cookies()) // ✅ perbaikan, sekarang pasti ada cookieStore
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ message: 'Akses ditolak: Tidak terautentikasi' }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    return { error: NextResponse.json({ message: 'Akses ditolak: Hanya admin yang diizinkan' }, { status: 403 }) }
  }

  return { error: null }
}

/**
 * GET: Mengambil daftar semua pengguna (hanya admin).
 */
export async function GET() {
  try {
    const { error: adminError } = await verifyAdmin()
    if (adminError) return adminError

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    if (usersError) throw usersError

    const { data: profiles, error: profilesError } = await supabaseAdmin.from('profiles').select('*')
    if (profilesError) throw profilesError

    const combinedUsers = users.map((user) => {
      const userProfile = profiles.find((p) => p.id === user.id)
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        full_name: userProfile?.full_name ?? null,
        avatar_url: userProfile?.avatar_url ?? null,
        role: userProfile?.role ?? 'user',
      }
    })

    return NextResponse.json(combinedUsers)
  } catch (error: any) {
    console.error('API GET Users Error:', error)
    return NextResponse.json({ message: `Gagal mengambil data pengguna: ${error.message}` }, { status: 500 })
  }
}

/**
 * POST: Membuat pengguna baru (hanya admin).
 */
export async function POST(request: NextRequest) {
  try {
    const { error: adminError } = await verifyAdmin()
    if (adminError) return adminError

    const body = await request.json()
    const validation = newUserSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Input tidak valid', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, password, full_name, role } = validation.data

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    })

    if (signUpError) {
      if (signUpError.message.includes('User already registered')) {
        return NextResponse.json({ message: 'Email ini sudah terdaftar.' }, { status: 409 })
      }
      throw signUpError
    }

    return NextResponse.json(
      { message: 'Pengguna baru berhasil ditambahkan', user: newUser.user },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('API POST User Error:', error)
    const errorMessage = error.message || 'Terjadi kesalahan internal pada server'
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
