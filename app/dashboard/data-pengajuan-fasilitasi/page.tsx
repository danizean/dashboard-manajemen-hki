// app/dashboard/data-pengajuan-fasilitasi/page.tsx

// HAPUS baris 'use client' dari sini

import { createClient } from '@/utils/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { HKIClientPage } from './hki-client-page'
import { cookies } from 'next/headers'
import { FormOptions } from '@/lib/types'
import { Database } from '@/lib/database.types'
import { cache } from 'react'

// Revalidasi data setiap jam untuk menjaga kesegaran data master
export const revalidate = 3600

// Definisikan tipe untuk parameter map agar tidak 'any'
type PengusulOptionRaw = { id_pengusul: number; nama_opd: string };
type KelasOptionRaw = { id_kelas: number; nama_kelas: string; tipe: string };

/**
 * Mengambil semua opsi form dalam satu panggilan RPC ke Supabase.
 * Menggunakan React `cache` untuk memoization, memastikan fungsi ini hanya berjalan sekali per request.
 */
const getFormOptions = cache(async (supabase: SupabaseClient<Database>): Promise<FormOptions> => {
  // Beri tipe eksplisit pada pemanggilan RPC
  const { data, error } = await supabase.rpc('get_all_form_options');

  if (error) {
    console.error('Gagal memuat form options via RPC:', error.message);
    throw new Error(`Gagal mengambil data form: ${error.message}`);
  }

  // Pastikan 'data' tidak null sebelum diakses
  if (!data) {
    throw new Error('RPC tidak mengembalikan data.');
  }

  return {
    jenisOptions: data.jenis_options || [],
    statusOptions: data.status_options || [],
    tahunOptions: data.tahun_options || [],
    pengusulOptions: data.pengusul_options?.map((p: PengusulOptionRaw) => ({
      value: String(p.id_pengusul),
      label: p.nama_opd,
    })) || [],
    kelasOptions: data.kelas_options?.map((k: KelasOptionRaw) => ({
      value: String(k.id_kelas),
      label: `${k.id_kelas} – ${k.nama_kelas} (${k.tipe})`,
    })) || [],
  }
});

export default async function HKIPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  let formOptions: FormOptions = {
    jenisOptions: [],
    statusOptions: [],
    tahunOptions: [],
    pengusulOptions: [],
    kelasOptions: [],
  };
  let pageError: string | null = null;

  try {
    formOptions = await getFormOptions(supabase)
  } catch (error) {
    console.error('Gagal memuat prasyarat halaman HKI:', error)
    pageError = error instanceof Error
        ? error.message
        : 'Gagal memuat opsi filter.'
  }
  
  return <HKIClientPage formOptions={formOptions} error={pageError} />
}