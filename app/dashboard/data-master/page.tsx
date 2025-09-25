// app/dashboard/data-master/page.tsx
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { MasterDataClient } from './master-data-client'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Revalidate data setiap jam, bagus untuk data master yang jarang berubah
export const revalidate = 3600

/**
 * Mengambil semua data master secara paralel dan membungkusnya dalam React `cache`.
 * `cache` memastikan fungsi ini hanya dieksekusi sekali per-request, bahkan jika
 * dipanggil dari beberapa tempat.
 */
const getMasterData = cache(async (supabase: SupabaseClient<Database>) => {
  const [jenisRes, kelasRes, pengusulRes] = await Promise.all([
    supabase.from('jenis_hki').select('*').order('id_jenis_hki'),
    supabase.from('kelas_hki').select('*').order('id_kelas'),
    supabase.from('pengusul').select('*').order('nama_opd'),
  ]);

  // ✅ Penanganan Error yang Lebih Baik:
  // Jika salah satu query gagal, seluruh halaman akan menampilkan error boundary.
  // Ini lebih baik daripada menampilkan tabel yang datanya tidak lengkap.
  if (jenisRes.error) throw new Error(`Gagal memuat Jenis HKI: ${jenisRes.error.message}`);
  if (kelasRes.error) throw new Error(`Gagal memuat Kelas HKI: ${kelasRes.error.message}`);
  if (pengusulRes.error) throw new Error(`Gagal memuat Pengusul: ${pengusulRes.error.message}`);

  // ✅ Mengembalikan data dalam satu objek, sesuai dengan props `MasterDataClient` yang baru.
  return {
    jenis_hki: jenisRes.data || [],
    kelas_hki: kelasRes.data || [],
    pengusul: pengusulRes.data || [],
  };
});

export default async function MasterDataPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Guard: Pastikan hanya admin yang bisa mengakses halaman ini
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (profile?.role !== 'admin') {
    redirect('/dashboard?error=Akses_Ditolak');
  }

  // Ambil data menggunakan fungsi yang sudah di-cache
  // Blok try-catch di sini bisa ditambahkan jika ingin menampilkan UI error kustom
  const masterData = await getMasterData(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Manajemen Data Master
        </h1>
        <p className="mt-1 text-muted-foreground">
          Kelola data referensi untuk Jenis HKI, Kelas HKI, dan Pengusul (OPD).
        </p>
      </div>

      {/* ✅ Mengirim data sebagai satu prop `initialData` */}
      <MasterDataClient initialData={masterData} />
    </div>
  );
}