// app/dashboard/data-pengajuan-fasilitasi/page.tsx
import { createClient } from '@/utils/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { HKIClientPage } from './hki-client-page'
import { cookies } from 'next/headers'
import { FormOptions } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * Fungsi ini tetap di sisi server untuk mengambil data
 * yang jarang berubah (opsi filter) sekali saat halaman dimuat.
 */
async function getFormOptions(supabase: SupabaseClient): Promise<FormOptions> {
  const [jenisRes, statusRes, tahunRes, pengusulRes, kelasRes] =
    await Promise.all([
      supabase.from('jenis_hki').select('id_jenis_hki, nama_jenis_hki').order('nama_jenis_hki'),
      supabase.from('status_hki').select('id_status, nama_status').order('id_status'),
      supabase.rpc('get_distinct_hki_years'),
      supabase.from('pengusul').select('id_pengusul, nama_opd').order('nama_opd'),
      supabase.from('kelas_hki').select('id_kelas, nama_kelas, tipe').order('id_kelas'),
    ])

  // Error handling untuk setiap query
  if (jenisRes.error) throw new Error(`Gagal memuat Jenis HKI: ${JSON.stringify(jenisRes.error)}`);
  if (statusRes.error) throw new Error(`Gagal memuat Status HKI: ${JSON.stringify(statusRes.error)}`);
  if (tahunRes.error) throw new Error(`Gagal memuat Tahun (RPC): ${JSON.stringify(tahunRes.error)}`);
  if (pengusulRes.error) throw new Error(`Gagal memuat Pengusul: ${JSON.stringify(pengusulRes.error)}`);
  if (kelasRes.error) throw new Error(`Gagal memuat Kelas HKI: ${JSON.stringify(kelasRes.error)}`);

  return {
    jenisOptions: jenisRes.data ?? [],
    statusOptions: statusRes.data ?? [],
    tahunOptions: tahunRes.data ?? [],
    pengusulOptions: (pengusulRes.data || []).map((p: { id_pengusul: number; nama_opd: string }) => ({ value: String(p.id_pengusul), label: p.nama_opd })),
    kelasOptions: (kelasRes.data || []).map((k: { id_kelas: number; nama_kelas: string; tipe: string }) => ({ value: String(k.id_kelas), label: `${k.id_kelas} – ${k.nama_kelas} (${k.tipe})` })),
  }
}

/**
 * HKIPage (Server Component) sekarang hanya bertanggung jawab untuk:
 * 1. Mengambil data awal untuk filter (formOptions).
 * 2. Merender HKIClientPage (Client Component) dan memberikan formOptions.
 *
 * Semua logika fetching data utama, pagination, dan filtering akan ditangani
 * di HKIClientPage menggunakan TanStack Query yang memanggil API Route.
 */
export default async function HKIPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // Satu-satunya data yang diambil di server adalah opsi untuk form.
    const formOptions = await getFormOptions(supabase);

    // Render komponen klien dan hanya teruskan formOptions.
    // Tidak ada lagi initialData, totalCount, dll.
    return (
      <HKIClientPage formOptions={formOptions} error={null} />
    )
  } catch (error) {
    console.error('Gagal memuat prasyarat halaman HKI:', error)
    // Jika pengambilan formOptions gagal, kirim state error ke klien.
    return (
      <HKIClientPage
        formOptions={{ jenisOptions: [], statusOptions: [], tahunOptions: [], pengusulOptions: [], kelasOptions: [] }}
        error={ error instanceof Error ? error.message : 'Gagal memuat opsi filter.' }
      />
    )
  }
}
