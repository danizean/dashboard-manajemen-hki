// app/dashboard/manajemen-pengguna/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { UserManagementClient } from './user-management-client'
import { cache } from 'react'
import { AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

// ✅ Tipe UserProfile dipindahkan ke file `types.ts` jika digunakan di tempat lain,
//    namun untuk saat ini kita biarkan di sini untuk kejelasan.
export type UserProfile = {
  id: string
  email?: string
  full_name: string
  role: 'admin' | 'user'
  created_at: string
}

/**
 * ✅ Mengambil dan menggabungkan data pengguna dengan React `cache`.
 * `cache` memastikan fungsi ini hanya dieksekusi sekali per-request,
 * meningkatkan performa dengan mendeduplikasi panggilan data.
 */
const getUsersData = cache(async () => {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  // Mengambil data pengguna dan profil secara paralel untuk efisiensi
  const [usersResult, profilesResult] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers(),
    supabaseAdmin.from('profiles').select('id, full_name, role'),
  ])

  const {
    data: { users },
    error: usersError,
  } = usersResult
  if (usersError) {
    console.error('Gagal mengambil daftar pengguna:', usersError)
    throw new Error(`Gagal mengambil daftar pengguna: ${usersError.message}`)
  }

  const { data: profiles, error: profilesError } = profilesResult
  if (profilesError) {
    console.error('Gagal mengambil data profil:', profilesError)
    throw new Error(`Gagal mengambil data profil: ${profilesError.message}`)
  }

  // ✅ Menggunakan Map untuk pencarian profil yang lebih cepat (O(1) vs O(n))
  const profilesMap = new Map(profiles?.map((p) => [p.id, p]))

  const combinedUsers: UserProfile[] = users.map((user) => {
    const profile = profilesMap.get(user.id)
    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name ?? 'Nama Tidak Ditemukan',
      role: profile?.role === 'admin' ? 'admin' : 'user', // Memastikan tipe peran yang valid
      created_at: user.created_at, // Tidak perlu new Date() karena sudah string ISO
    }
  })

  return combinedUsers
})

// ✅ Komponen untuk menampilkan error dengan UI yang konsisten
const ErrorDisplay = ({ error }: { error: Error }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-destructive bg-red-50 p-12 text-center dark:bg-red-950/30">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
      <AlertTriangle className="h-8 w-8 text-destructive" />
    </div>
    <h3 className="mt-4 text-2xl font-semibold tracking-tight text-destructive">
      Gagal Memuat Data Pengguna
    </h3>
    <p className="mt-2 text-sm text-muted-foreground">
      Terjadi kesalahan saat mencoba mengambil data dari server.
    </p>
    <code className="my-4 max-w-full overflow-x-auto rounded bg-red-100 p-2 text-xs text-red-800 dark:bg-red-900 dark:text-red-200">
      {error.message}
    </code>
  </div>
)

export default async function UserManagementPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // ✅ Logika otentikasi dan otorisasi tetap sama, sudah sangat baik.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard?error=Akses_Ditolak')
  }

  const isSuperAdmin = user.email === process.env.SUPER_ADMIN_EMAIL

  try {
    const usersData = await getUsersData()

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
          <p className="mt-1 text-muted-foreground">
            Tambah, edit, dan kelola peran pengguna yang dapat mengakses dasbor.
          </p>
        </div>
        <UserManagementClient
          initialUsers={usersData}
          currentUserIsSuperAdmin={isSuperAdmin}
        />
      </div>
    )
  } catch (error) {
    // ✅ Menampilkan komponen ErrorDisplay yang lebih informatif
    return <ErrorDisplay error={error as Error} />
  }
}
