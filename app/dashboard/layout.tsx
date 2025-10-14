// app/dashboard/layout.tsx
import { Metadata } from 'next'
import { AdminLayout } from '@/components/layout/admin-layout'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Manajemen Pengajuan Data HKI | Dashboard',
  description: 'Manajemen Pengajuan Data Hak Kekayaan Intelektual',
}

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Jika tidak ada user, langsung redirect ke halaman login
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Jika profil bukan admin, redirect dengan pesan error
  if (profile?.role !== 'admin') {
    redirect('/dashboard?error=Akses_Ditolak')
  }

  // Jika semua validasi lolos, render layout dengan children (halaman).
  // Tidak perlu try...catch di sini.
  return <AdminLayout>{children}</AdminLayout>
}
