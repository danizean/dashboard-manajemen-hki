// app/dashboard/data-pengajuan-fasilitasi/page.tsx
import { createClient } from '@/utils/supabase/server'
import { HKIClientPage } from './hki-client-page'
import { cookies } from 'next/headers'
import { FormOptions } from '@/lib/types'
import { Database } from '@/lib/database.types'
import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

export const revalidate = 3600

const getFormOptions = cache(
  async (supabase: SupabaseClient<Database>): Promise<FormOptions> => {
    const { data, error } = await supabase.rpc('get_all_form_options')

    if (error) {
      console.error('Gagal memanggil RPC get_all_form_options:', error)
      throw new Error(`Gagal mengambil data opsi form: ${error.message}`)
    }

    return {
      jenisOptions: data.jenis_options || [],
      statusOptions: data.status_options || [],
      tahunOptions: data.tahun_options || [],
      pengusulOptions:
        data.pengusul_options?.map((p) => ({
          value: String(p.id_pengusul),
          label: p.nama_opd,
        })) || [],
      kelasOptions:
        data.kelas_options?.map((k) => ({
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

  return <HKIClientPage formOptions={formOptions} error={pageError} />
}
