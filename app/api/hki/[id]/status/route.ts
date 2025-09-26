// app/api/hki/[id]/status/route.ts

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// ✅ OPTIMISASI: Skema validasi digabung untuk body dan parameter URL.
// `z.coerce.number()` secara otomatis akan mengubah string dari params menjadi angka.
const updateStatusSchema = z.object({
  id: z.coerce.number().int().positive('ID HKI harus berupa angka positif.'),
  statusId: z
    .number({ required_error: 'ID Status wajib diisi.' })
    .int()
    .positive('ID Status harus angka positif.'),
})

// ✅ OPTIMISASI: Helper untuk membuat respons error yang konsisten.
function apiError(message: string, status: number, errors?: object) {
  return NextResponse.json({ message, errors }, { status })
}

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

  try {
    // 1. Ambil dan Validasi SEMUA input (body & params) sekaligus dengan Zod
    const body = await request.json()
    const validationResult = updateStatusSchema.safeParse({
      id: params.id,
      statusId: body.statusId,
    })

    if (!validationResult.success) {
      return apiError(
        'Input tidak valid.',
        400,
        validationResult.error.flatten().fieldErrors
      )
    }
    const { id: hkiId, statusId } = validationResult.data

    // 2. Verifikasi Autentikasi dan Otorisasi Pengguna (Admin)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return apiError('Akses ditolak: Anda tidak terautentikasi.', 401)
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return apiError(
        'Akses ditolak: Hanya admin yang dapat mengubah status.',
        403
      )
    }

    // 3. Jalankan Query UPDATE ke Database
    const { data: updatedData, error: updateError } = await supabase
      .from('hki')
      .update({
        id_status: statusId,
        updated_at: new Date().toISOString(), // Selalu perbarui timestamp `updated_at`
      })
      .eq('id_hki', hkiId)
      .select('id_hki, status_hki(nama_status)') // Kembalikan data baru untuk konfirmasi
      .single()

    // 4. Tangani jika terjadi error saat query
    if (updateError) {
      console.error('Supabase PATCH Status Error:', updateError)
      // Kode untuk 'no rows found' karena .single()
      if (updateError.code === 'PGRST116') {
        return apiError(`Data HKI dengan ID ${hkiId} tidak ditemukan.`, 404)
      }
      return apiError('Gagal memperbarui data di database.', 500)
    }

    // 5. Kirim respons sukses
    return NextResponse.json({
      success: true,
      message: `Status berhasil diperbarui ke "${updatedData.status_hki?.nama_status || 'status baru'}"`,
      data: updatedData,
    })
  } catch (err) {
    // Tangani error parsing JSON atau kesalahan tak terduga lainnya
    console.error('[API HKI STATUS PATCH] Internal Server Error:', err)
    if (err instanceof SyntaxError) {
      return apiError('Request body tidak valid (bukan JSON).', 400)
    }
    return apiError('Terjadi kesalahan pada server.', 500)
  }
}
