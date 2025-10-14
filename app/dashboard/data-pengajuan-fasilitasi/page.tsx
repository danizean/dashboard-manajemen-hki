// app/dashboard/data-pengajuan-fasilitasi/page.tsx
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { FormOptions } from '@/lib/types'
import { Database } from '@/lib/database.types'
import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

// ✅ FIX: Impor komponen loader yang baru dibuat
import HkiPageLoader from './hki-page-loader'

export const revalidate = 3600

const getFormOptions = cache(
  async (supabase: SupabaseClient<Database>): Promise<FormOptions> => {
    // Fungsi ini tidak perlu diubah, biarkan seperti yang sudah ada
    const [jenisRes, statusRes, tahunRes, pengusulRes, kelasRes] =
      await Promise.all([
        supabase.from('jenis_hki').select('*').order('nama_jenis_hki'),
        supabase.from('status_hki').select('*').order('id_status'),
        supabase
          .from('hki')
          .select('tahun_fasilitasi')
          .order('tahun_fasilitasi', { ascending: false }),
        supabase.from('pengusul').select('*').order('nama_opd'),
        supabase.from('kelas_hki').select('*').order('id_kelas'),
      ])

    if (jenisRes.error)
      throw new Error(`Gagal mengambil Jenis HKI: ${jenisRes.error.message}`)
    if (statusRes.error)
      throw new Error(`Gagal mengambil Status HKI: ${statusRes.error.message}`)
    if (tahunRes.error)
      throw new Error(
        `Gagal mengambil Tahun Fasilitasi: ${tahunRes.error.message}`
      )
    if (pengusulRes.error)
      throw new Error(`Gagal mengambil Pengusul: ${pengusulRes.error.message}`)
    if (kelasRes.error)
      throw new Error(`Gagal mengambil Kelas HKI: ${kelasRes.error.message}`)

    const uniqueYears = [
      ...new Set(
        tahunRes.data
          ?.map((y) => y.tahun_fasilitasi)
          .filter(Boolean) as number[]
      ),
    ].sort((a, b) => b - a)

    return {
      jenisOptions: jenisRes.data || [],
      statusOptions: statusRes.data || [],
      tahunOptions: uniqueYears.map((tahun) => ({ tahun })) || [],
      pengusulOptions:
        pengusulRes.data?.map((p) => ({
          value: String(p.id_pengusul),
          label: p.nama_opd,
        })) || [],
      kelasOptions:
        kelasRes.data?.map((k) => ({
          value: String(k.id_kelas),
          label: `${k.id_kelas} – ${k.nama_kelas} (${k.tipe})`,
        })) || [],
    }
  }
)

export default async function HKIPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  let formOptions: FormOptions = {
    jenisOptions: [],
    statusOptions: [],
    tahunOptions: [],
    pengusulOptions: [],
    kelasOptions: [],
  }
  let pageError: string | null = null

  try {
    formOptions = await getFormOptions(supabase)
  } catch (error) {
    console.error('Gagal memuat prasyarat halaman HKI:', error)
    pageError =
      error instanceof Error
        ? error.message
        : 'Terjadi kesalahan tidak dikenal saat memuat opsi filter.'
  }

  // ✅ FIX: Render komponen loader, bukan melakukan dynamic import di sini
  return <HkiPageLoader formOptions={formOptions} error={pageError} />
}
