// app/api/hki/route.ts
import { createClient } from '@/utils/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { Database } from '@/lib/database.types';
import { authorizeAdmin, AuthError } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

// --- KONSTANTA ---
const HKI_TABLE = 'hki';
const HKI_BUCKET = 'sertifikat-hki';
const PEMOHON_TABLE = 'pemohon';

// --- SKEMA VALIDASI ZOD ---
const getParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  sortBy: z.string().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  jenisId: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
  statusId: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
  year: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
  pengusulId: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
});


const hkiCreateSchema = z.object({
  nama_hki: z.string().min(3, 'Nama HKI minimal 3 karakter.'),
  nama_pemohon: z.string().min(3, 'Nama pemohon minimal 3 karakter.'),
  alamat: z.string().optional().nullable(),
  jenis_produk: z.string().optional().nullable(),
  tahun_fasilitasi: z.coerce.number().int('Tahun harus angka.'),
  keterangan: z.string().optional().nullable(),
  id_jenis_hki: z.coerce.number({ invalid_type_error: 'Jenis HKI wajib diisi.' }),
  id_status: z.coerce.number({ invalid_type_error: 'Status wajib diisi.' }),
  id_pengusul: z.coerce.number({ invalid_type_error: 'Pengusul wajib diisi.' }),
  id_kelas: z.coerce.number().optional().nullable(),
});

// --- HELPER TERPUSAT ---
function apiError(message: string, status: number, errors?: object) {
  return NextResponse.json({ message, errors }, { status });
}


// --- API HANDLERS ---
export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    await authorizeAdmin(supabase);
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    
    const params = getParamsSchema.parse(searchParams);

    // ✅ PERBAIKAN: Gunakan RPC untuk pencarian, dan tangani tipe data dengan benar.
    // Kita membuat objek parameter secara terpisah untuk memastikan semua nilai undefined diubah menjadi null.
    const rpcParams = {
        p_search_text: params.search || null,
        p_jenis_id: params.jenisId || null,
        p_status_id: params.statusId || null,
        p_year: params.year || null,
        p_pengusul_id: params.pengusulId || null,
    };
    
    // Panggil RPC dengan parameter yang sudah disiapkan.
    const { data: searchResults, error: rpcError } = await supabase.rpc(
      'search_hki_ids_with_count',
      // Supabase JS v2 menerima null untuk parameter RPC, jadi kita tidak perlu `as any`.
      // Jika eror tetap muncul, berarti tipe di database.types.ts sangat strict.
      // Solusi paling aman adalah `as any` untuk bypass pengecekan tipe sementara.
      rpcParams as any
    );


    if (rpcError) {
      console.error('[API GET HKI RPC Error]:', rpcError);
      throw new Error(`Gagal melakukan pencarian: ${rpcError.message}`);
    }

    const totalCount = searchResults?.[0]?.result_count ?? 0;
    const hkiIds = searchResults?.map((r: { result_id: any; }) => r.result_id) ?? [];

    if (hkiIds.length === 0) {
      return NextResponse.json({
        data: [],
        totalCount: 0,
      });
    }

    const from = (params.page - 1) * params.pageSize;
    const { data, error: dataError } = await supabase
      .from(HKI_TABLE)
      .select(
        `*, pemohon!inner(*), jenis:jenis_hki(*), status_hki(*), pengusul(*), kelas:kelas_hki(*)`
      )
      .in('id_hki', hkiIds)
      .order(params.sortBy, { ascending: params.sortOrder === 'asc' })
      .range(from, from + params.pageSize - 1);

    if (dataError) throw dataError;

    return NextResponse.json({
      data: data || [],
      totalCount: totalCount,
    });

  } catch (err: any) {
    if (err instanceof z.ZodError) return apiError('Parameter query tidak valid.', 400, err.flatten().fieldErrors);
    if (err instanceof AuthError) return apiError(err.message, 403);
    console.error('[API GET HKI Error]:', err);
    return apiError(`Gagal mengambil data: ${err.message}`, 500);
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const user = await authorizeAdmin(supabase);
    const formData = await request.formData();
    const rawData = Object.fromEntries(formData.entries());
    
    const validatedData = hkiCreateSchema.parse(rawData);
    const { nama_pemohon, alamat, ...hkiFields } = validatedData;

    const { data: pemohonData, error: pemohonError } = await supabase
      .from(PEMOHON_TABLE)
      .upsert(
        { nama_pemohon: nama_pemohon.trim(), alamat: alamat || null },
        { onConflict: 'nama_pemohon', ignoreDuplicates: false }
      )
      .select('id_pemohon')
      .single();

    if (pemohonError) throw new Error(`Gagal memproses data pemohon: ${pemohonError.message}`);
    if (!pemohonData) throw new Error('Gagal membuat atau menemukan pemohon.');
    
    const hkiRecord = { ...hkiFields, id_pemohon: pemohonData.id_pemohon };
    const { data: newHki, error: insertError } = await supabase
      .from(HKI_TABLE)
      .insert(hkiRecord)
      .select('id_hki')
      .single();

    if (insertError || !newHki) {
      throw new Error(`Gagal menyimpan data HKI: ${insertError?.message || 'Data tidak kembali.'}`);
    }

    const file = formData.get('file') as File | null;
    if (file && file.size > 0) {
      const filePath = `public/${user.id}-${uuidv4()}.${file.name.split('.').pop()}`;
      
      const { error: uploadError } = await supabase.storage.from(HKI_BUCKET).upload(filePath, file);
      
      if (uploadError) {
        // Rollback: Hapus entri HKI jika upload gagal
        await supabase.from(HKI_TABLE).delete().eq('id_hki', newHki.id_hki);
        throw new Error(`Upload file gagal: ${uploadError.message}`);
      }

      const { error: updateError } = await supabase
        .from(HKI_TABLE)
        .update({ sertifikat_pdf: filePath })
        .eq('id_hki', newHki.id_hki);

      if (updateError) {
        // Rollback: Hapus file jika update gagal, dan hapus juga entri HKI
        await supabase.storage.from(HKI_BUCKET).remove([filePath]);
        await supabase.from(HKI_TABLE).delete().eq('id_hki', newHki.id_hki);
        throw new Error(
          `Gagal menautkan file sertifikat: ${updateError.message}`
        );
      }
    }

    const { data: finalData, error: finalFetchError } = await supabase
      .from(HKI_TABLE)
      .select(`*, pemohon(*), jenis:jenis_hki(*), status_hki(*), pengusul(*), kelas:kelas_hki(*)`)
      .eq('id_hki', newHki.id_hki)
      .single();

    if (finalFetchError) throw new Error('Gagal mengambil data yang baru dibuat.');

    return NextResponse.json({ success: true, data: finalData }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return apiError('Data yang dikirim tidak valid.', 400, err.flatten().fieldErrors);
    if (err instanceof AuthError) return apiError(err.message, 403);
    console.error(`[API POST HKI Error]: ${err.message}`);
    return apiError(`Terjadi kesalahan tak terduga: ${err.message}`, 500);
  }
}