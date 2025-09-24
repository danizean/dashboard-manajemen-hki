// app/dashboard/data-pengajuan-fasilitasi/page.tsx
import { createClient } from '@/utils/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { HKIClientPage } from './hki-client-page'
import { cookies } from 'next/headers'
import { FormOptions } from '@/lib/types'
import { Database } from '@/lib/database.types'

// Revalidasi data setiap jam untuk menjaga kesegaran data master
export const revalidate = 3600

async function getFormOptions(supabase: SupabaseClient<Database>): Promise<FormOptions> {
  
  // Menggunakan Promise.allSettled untuk ketahanan error.
  const results = await Promise.allSettled([
    supabase
      .from('jenis_hki')
      .select('id_jenis_hki, nama_jenis_hki')
      .order('nama_jenis_hki'),
    supabase
      .from('status_hki')
      .select('id_status, nama_status')
      .order('id_status'),
    supabase.rpc('get_distinct_hki_years'),
    supabase
      .from('pengusul')
      .select('id_pengusul, nama_opd')
      .order('nama_opd'),
    supabase
      .from('kelas_hki')
      .select('id_kelas, nama_kelas, tipe')
      .order('id_kelas'),
  ])

  // Helper untuk menangani hasil dari allSettled dan mencatat error
  const getResultData = (result: PromiseSettledResult<any>, name: string) => {
    if (result.status === 'fulfilled' && !result.value.error) {
      return result.value.data ?? []
    }
    if (result.status === 'rejected' || result.value.error) {
      console.error(
        `Gagal memuat opsi untuk "${name}":`,
        result.status === 'rejected' ? result.reason : result.value.error.message
      )
    }
    return [] // Kembalikan array kosong jika gagal
  }

  const jenisOptions = getResultData(results[0], 'Jenis HKI')
  const statusOptions = getResultData(results[1], 'Status HKI')
  const tahunOptions = getResultData(results[2], 'Tahun HKI (RPC)')
  const pengusulOptionsRaw = getResultData(results[3], 'Pengusul')
  const kelasOptionsRaw = getResultData(results[4], 'Kelas HKI')

  return {
    jenisOptions,
    statusOptions,
    tahunOptions,
    pengusulOptions: pengusulOptionsRaw.map(
      (p: { id_pengusul: number; nama_opd: string }) => ({
        value: String(p.id_pengusul),
        label: p.nama_opd,
      })
    ),
    kelasOptions: kelasOptionsRaw.map(
      (k: { id_kelas: number; nama_kelas: string; tipe: string }) => ({
        value: String(k.id_kelas),
        label: `${k.id_kelas} – ${k.nama_kelas} (${k.tipe})`,
      })
    ),
  }
}

export default async function HKIPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const formOptions = await getFormOptions(supabase)
    return <HKIClientPage formOptions={formOptions} error={null} />
  } catch (error) {
    console.error('Gagal memuat prasyarat halaman HKI:', error)
    return (
      <HKIClientPage
        formOptions={{
          jenisOptions: [],
          statusOptions: [],
          tahunOptions: [],
          pengusulOptions: [],
          kelasOptions: [],
        }}
        error={
          error instanceof Error
            ? error.message
            : 'Gagal memuat opsi filter.'
        }
      />
    )
  }
}