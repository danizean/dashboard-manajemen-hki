import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { Database } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

// --- KONSTANTA & KONFIGURASI ---
const HKI_TABLE = 'hki'
const PEMOHON_TABLE = 'pemohon'
const HKI_BUCKET = 'sertifikat-hki'

const ALIASED_SELECT_QUERY = `
  id_hki, nama_hki, jenis_produk, tahun_fasilitasi, sertifikat_pdf, keterangan, created_at,
  pemohon ( id_pemohon, nama_pemohon, alamat ),
  jenis:jenis_hki ( id_jenis_hki, nama_jenis_hki ), 
  status_hki ( id_status, nama_status ),
  pengusul ( id_pengusul, nama_opd ),
  kelas:kelas_hki ( id_kelas, nama_kelas, tipe )
`

// --- HANDLER GET: Mengambil data HKI ---
export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const page = Number(searchParams.get('page') || '1')
    const pageSize = Number(searchParams.get('pageSize') || '50')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const search = searchParams.get('search')
    const jenisId = searchParams.get('jenisId')
    const statusId = searchParams.get('statusId')
    const year = searchParams.get('year')
    const pengusulId = searchParams.get('pengusulId')

    let query = supabase.from(HKI_TABLE).select(ALIASED_SELECT_QUERY, { count: 'exact' })

    // ✅ PERBAIKAN FINAL & STABIL: Logika pencarian yang aman
    if (search) {
      // 1. Ambil ID pemohon yang cocok secara terpisah. Ini jauh lebih aman.
      const { data: pemohonData } = await supabase
        .from('pemohon')
        .select('id_pemohon')
        .ilike('nama_pemohon', `%${search}%`);
      
      const pemohonIds = pemohonData?.map(p => p.id_pemohon) || [];

      // 2. Bangun klausa .or() yang hanya berisi filter pada tabel utama 'hki'
      // dan filter 'id_pemohon' yang sudah kita dapatkan.
      const orClauses = [
        `nama_hki.ilike.%${search}%`,
        `jenis_produk.ilike.%${search}%`,
        // Tambahkan pencarian berdasarkan ID pemohon jika ditemukan
        ...(pemohonIds.length > 0 ? [`id_pemohon.in.(${pemohonIds.join(',')})`] : [])
      ];
      
      query = query.or(orClauses.join(','));
    }
    
    // Terapkan filter lainnya
    if (jenisId) query = query.eq('id_jenis_hki', Number(jenisId))
    if (statusId) query = query.eq('id_status', Number(statusId))
    if (year) query = query.eq('tahun_fasilitasi', Number(year))
    if (pengusulId) query = query.eq('id_pengusul', Number(pengusulId))

    // Terapkan sorting dan paginasi
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    const from = (page - 1) * pageSize
    query = query.range(from, from + pageSize - 1)

    // Eksekusi query
    const { data, error, count } = await query

    if (error) {
      console.error('Supabase GET Error:', error)
      throw new Error(`Gagal mengambil data dari database: ${error.message}`)
    }
    
    return NextResponse.json({
      data: data || [],
      totalCount: count ?? 0,
    })

  } catch (err: any) {
    console.error(`[API GET HKI Error]: ${err.message}`)
    return NextResponse.json(
      { message: `Terjadi kesalahan pada server: ${err.message}` },
      { status: 500 }
    )
  }
}

// --- FUNGSI HELPER & HANDLER POST (Tidak Diubah, Sudah Benar) ---
async function getPemohonId(
  supabase: ReturnType<typeof createClient>,
  nama: string,
  alamat: string | null
): Promise<number> {
  const trimmedNama = nama.trim()
  if (!trimmedNama) throw new Error('Nama pemohon tidak boleh kosong.')
  const { data: existingPemohon, error: findError } = await supabase.from(PEMOHON_TABLE).select('id_pemohon').eq('nama_pemohon', trimmedNama).limit(1).single()
  if (findError && findError.code !== 'PGRST116') { throw new Error('Gagal memeriksa data pemohon: ' + findError.message) }
  if (existingPemohon) return existingPemohon.id_pemohon
  const { data: newPemohon, error: insertError } = await supabase.from(PEMOHON_TABLE).insert({ nama_pemohon: trimmedNama, alamat: alamat }).select('id_pemohon').single()
  if (insertError) { if (insertError.code === '23505') { throw new Error(`Nama pemohon "${trimmedNama}" sudah terdaftar.`) } throw new Error('Gagal menyimpan data pemohon baru: ' + insertError.message) }
  if (!newPemohon) throw new Error('Gagal membuat atau menemukan pemohon setelah insert.')
  return newPemohon.id_pemohon
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 }) }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') { return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 }) }

    const formData = await request.formData()
    const getVal = (key: string) => formData.get(key)
    const namaPemohon = getVal('nama_pemohon') as string
    if (!namaPemohon) { return NextResponse.json({ success: false, message: 'Nama pemohon wajib diisi.' }, { status: 400 }) }
    const pemohonId = await getPemohonId(supabase, namaPemohon, getVal('alamat') as string | null)

    const hkiRecord: Omit<Database['public']['Tables']['hki']['Insert'], 'id_hki' | 'created_at' | 'updated_at' | 'sertifikat_pdf'> = {
      nama_hki: String(getVal('nama_hki') || '').trim(),
      jenis_produk: (getVal('jenis_produk') as string | null) || null,
      tahun_fasilitasi: Number(getVal('tahun_fasilitasi')),
      keterangan: (getVal('keterangan') as string | null) || null,
      id_jenis_hki: Number(getVal('id_jenis_hki')),
      id_status: Number(getVal('id_status')),
      id_pengusul: Number(getVal('id_pengusul')),
      id_pemohon: pemohonId,
      id_kelas: getVal('id_kelas') ? Number(getVal('id_kelas')) : null,
    }

    const { data: newHki, error: insertError } = await supabase.from(HKI_TABLE).insert(hkiRecord).select('id_hki').single()
    if (insertError) throw new Error(`Database error: ${insertError.message}`)
    if (!newHki) throw new Error('Gagal mendapatkan ID HKI baru setelah insert.')

    let newHkiId = newHki.id_hki
    const file = formData.get('file') as File | null
    if (file && file.size > 0) {
      const filePath = `public/${user.id}-${uuidv4()}.${file.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage.from(HKI_BUCKET).upload(filePath, file)
      if (uploadError) { await supabase.from(HKI_TABLE).delete().eq('id_hki', newHkiId); throw new Error(`Upload file gagal: ${uploadError.message}`) }
      const { error: updateFileError } = await supabase.from(HKI_TABLE).update({ sertifikat_pdf: filePath }).eq('id_hki', newHkiId)
      if (updateFileError) { await supabase.storage.from(HKI_BUCKET).remove([filePath]); await supabase.from(HKI_TABLE).delete().eq('id_hki', newHkiId); throw new Error(`Gagal update path file: ${updateFileError.message}`) }
    }

    const { data: finalData, error: finalFetchError } = await supabase.from(HKI_TABLE).select(ALIASED_SELECT_QUERY).eq('id_hki', newHkiId).single()
    if (finalFetchError) throw new Error('Gagal mengambil data baru.')

    return NextResponse.json({ success: true, data: finalData }, { status: 201 })
  } catch (err: any) {
    console.error(`[API POST HKI Error]: ${err.message}`)
    return NextResponse.json({ success: false, message: `Terjadi kesalahan tak terduga: ${err.message}` }, { status: 500 })
  }
}

