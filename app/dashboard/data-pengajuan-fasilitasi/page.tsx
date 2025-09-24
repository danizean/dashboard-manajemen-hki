// app/dashboard/data-pengajuan-fasilitasi/page.tsx
import { createClient } from '@/utils/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { HKIClientPage } from './hki-client-page'
import { cookies } from 'next/headers'
import { FormOptions } from '@/lib/types'

export const revalidate = 3600
async function getFormOptions(supabase: SupabaseClient): Promise<FormOptions> {
  const [jenisRes, statusRes, tahunRes, pengusulRes, kelasRes] =
    await Promise.all([
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

  if (jenisRes.error)
    throw new Error(`Gagal memuat Jenis HKI: ${jenisRes.error.message}`)
  if (statusRes.error)
    throw new Error(`Gagal memuat Status HKI: ${statusRes.error.message}`)
  if (tahunRes.error)
    throw new Error(`Gagal memuat Tahun (RPC): ${tahunRes.error.message}`)
  if (pengusulRes.error)
    throw new Error(`Gagal memuat Pengusul: ${pengusulRes.error.message}`)
  if (kelasRes.error)
    throw new Error(`Gagal memuat Kelas HKI: ${kelasRes.error.message}`)

  return {
    jenisOptions: jenisRes.data ?? [],
    statusOptions: statusRes.data ?? [],
    tahunOptions: tahunRes.data ?? [],
    pengusulOptions: (pengusulRes.data || []).map(
      (p: { id_pengusul: number; nama_opd: string }) => ({
        value: String(p.id_pengusul),
        label: p.nama_opd,
      })
    ),
    kelasOptions: (kelasRes.data || []).map(
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
