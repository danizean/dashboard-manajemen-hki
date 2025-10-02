// app/dashboard/data-pengajuan-fasilitasi/page.tsx
import { createClient } from '@/utils/supabase/server'
import { HKIClientPage } from './hki-client-page'
import { cookies } from 'next/headers'
import { FormOptions } from '@/lib/types'
import { Database } from '@/lib/database.types'
import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

// Data master jarang berubah, caching selama 1 jam adalah strategi yang baik.
export const revalidate = 3600

// Definisikan tipe eksplisit untuk data mentah dari RPC untuk type safety maksimal.
type PengusulOptionRaw = { id_pengusul: number; nama_opd: string }
type KelasOptionRaw = { id_kelas: number; nama_kelas: string; tipe: string }

/**
 * Mengambil semua opsi (untuk filter dan form) dalam satu panggilan.
 * Dibungkus dengan React `cache` untuk memastikan fungsi ini hanya dieksekusi
 * sekali per-request.
 */
const getFormOptions = cache(
  async (supabase: SupabaseClient<Database>): Promise<FormOptions> => {
    // Ambil semua data secara paralel untuk efisiensi
    const [
      jenisRes,
      statusRes,
      tahunRes,
      pengusulRes,
      kelasRes,
    ] = await Promise.all([
      supabase.from('jenis_hki').select('*').order('nama_jenis_hki'),
      supabase.from('status_hki').select('*').order('id_status'),
      supabase.rpc('get_distinct_hki_years'),
      supabase.from('pengusul').select('id_pengusul, nama_opd').order('nama_opd'),
      supabase.from('kelas_hki').select('id_kelas, nama_kelas, tipe').order('id_kelas'),
    ])

    // Lakukan pengecekan error untuk setiap query
    if (jenisRes.error) throw new Error(`Gagal mengambil Jenis HKI: ${jenisRes.error.message}`);
    if (statusRes.error) throw new Error(`Gagal mengambil Status HKI: ${statusRes.error.message}`);
    if (tahunRes.error) throw new Error(`Gagal mengambil Tahun HKI: ${tahunRes.error.message}`);
    if (pengusulRes.error) throw new Error(`Gagal mengambil Pengusul: ${pengusulRes.error.message}`);
    if (kelasRes.error) throw new Error(`Gagal mengambil Kelas HKI: ${kelasRes.error.message}`);

    // Transformasi data mentah menjadi format yang siap pakai untuk komponen UI.
    return {
      jenisOptions: jenisRes.data || [],
      statusOptions: statusRes.data || [],
      // --- PERBAIKAN: Ubah nama properti dari 'tahun_fasilitasi' menjadi 'tahun' ---
      // Ini akan menyelesaikan error TypeScript dan error build di Vercel.
      tahunOptions:
        tahunRes.data?.map((y) => ({ tahun: y.tahun_fasilitasi })) || [],
      pengusulOptions:
        pengusulRes.data?.map((p: PengusulOptionRaw) => ({
          value: String(p.id_pengusul),
          label: p.nama_opd,
        })) || [],
      kelasOptions:
        kelasRes.data?.map((k: KelasOptionRaw) => ({
          value: String(k.id_kelas),
          label: `${k.id_kelas} – ${k.nama_kelas} (${k.tipe})`,
        })) || [],
    }
  }
)

/**
 * Komponen Halaman (React Server Component).
 */
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
    // Memanggil fungsi yang sudah di-cache untuk mendapatkan data.
    formOptions = await getFormOptions(supabase)
  } catch (error) {
    console.error('Gagal memuat prasyarat halaman HKI:', error)
    // Menyiapkan pesan error yang akan ditampilkan di komponen klien.
    pageError =
      error instanceof Error
        ? error.message
        : 'Terjadi kesalahan tidak dikenal saat memuat opsi filter.'
  }

  // Me-render komponen klien dan meneruskan data sebagai props.
  return <HKIClientPage formOptions={formOptions} error={pageError} />
}