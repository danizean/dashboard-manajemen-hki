import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Handler untuk memperbarui status entri HKI (PATCH).
 * Menerima ID HKI dari URL dan ID Status baru dari body request.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const hkiId = Number(params.id)

  // Validasi awal ID dari URL
  if (isNaN(hkiId)) {
    return NextResponse.json({ message: 'ID HKI tidak valid' }, { status: 400 })
  }

  try {
    // 1. Verifikasi Autentikasi dan Otorisasi Pengguna (Admin)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: 'Tidak terautentikasi' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ message: 'Akses ditolak. Hanya admin yang dapat mengubah status.' }, { status: 403 })
    }

    // 2. Ambil dan Validasi `statusId` dari Body Request
    const { statusId } = await request.json()
    if (!statusId || typeof statusId !== 'number') {
      return NextResponse.json({ message: 'ID Status tidak valid atau tidak ada di body request' }, { status: 400 })
    }

    // 3. Jalankan Query UPDATE ke Database
    const { data: updatedData, error } = await supabase
      .from('hki')
      .update({
        id_status: statusId,
        updated_at: new Date().toISOString(), // Selalu perbarui timestamp `updated_at`
      })
      .eq('id_hki', hkiId)
      .select('id_hki, status_hki(nama_status)') // Kembalikan data baru untuk konfirmasi
      .single() // Gunakan .single() karena kita hanya update satu baris

    // 4. Tangani jika terjadi error saat query
    if (error) {
      console.error('Gagal update status inline:', error)
      // Jika error karena data tidak ditemukan (misal, id_hki salah)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: `Data HKI dengan ID ${hkiId} tidak ditemukan` }, { status: 404 })
      }
      return NextResponse.json({ message: error.message }, { status: 500 })
    }
    
    // 5. Pastikan data yang diupdate ada sebelum mengirim respons
    if (!updatedData || !updatedData.status_hki) {
        return NextResponse.json({ message: 'Gagal mendapatkan konfirmasi status baru setelah update.' }, { status: 500 });
    }

    // 6. Kirim respons sukses
    return NextResponse.json({
      success: true,
      message: `Status berhasil diperbarui ke "${updatedData.status_hki.nama_status}"`,
      data: updatedData,
    })

  } catch (err: any) {
    console.error('Error di API update status:', err)
    return NextResponse.json({ message: `Terjadi kesalahan internal: ${err.message}` }, { status: 500 })
  }
}