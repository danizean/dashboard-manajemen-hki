// app/api/hki/route.ts
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Database } from '@/lib/database.types';
import { authorizeAdmin, AuthError } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

const HKI_TABLE = 'hki';

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

function apiError(message: string, status: number, errors?: object) {
  return NextResponse.json({ message, errors }, { status });
}

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    await authorizeAdmin(supabase);
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    
    const params = getParamsSchema.parse(searchParams);

    // --- PERBAIKAN UTAMA: Mengganti !inner(*) menjadi (*) untuk left join yang lebih aman ---
    let query = supabase
      .from(HKI_TABLE)
      .select(
        `*, pemohon(*), jenis:jenis_hki(*), status_hki(*), pengusul(*), kelas:kelas_hki(*)`, // PERUBAHAN KRUSIAL DI SINI
        { count: 'exact' }
      );

    if (params.search) {
      query = query.or(`nama_hki.ilike.%${params.search}%,pemohon.nama_pemohon.ilike.%${params.search}%,jenis_produk.ilike.%${params.search}%`);
    }
    if (params.jenisId) {
      query = query.eq('id_jenis_hki', params.jenisId);
    }
    if (params.statusId) {
      query = query.eq('id_status', params.statusId);
    }
    if (params.year) {
      query = query.eq('tahun_fasilitasi', params.year);
    }
    if (params.pengusulId) {
      query = query.eq('id_pengusul', params.pengusulId);
    }

    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);

    const [sortColumn, ...sortRest] = params.sortBy.split('.');
    if (sortRest.length > 0 && sortColumn === 'pemohon') { // Hanya handle sorting untuk pemohon
      query = query.order(sortRest.join('.'), {
        ascending: params.sortOrder === 'asc',
        foreignTable: 'pemohon',
      });
    } else {
      query = query.order(params.sortBy, {
        ascending: params.sortOrder === 'asc',
      });
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('[API GET HKI Query Error]:', error);
        throw new Error(`Gagal mengambil data: ${error.message}`);
    }

    return NextResponse.json({
      data: data || [],
      totalCount: count ?? 0,
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
  const HKI_BUCKET = 'sertifikat-hki';
  const PEMOHON_TABLE = 'pemohon';
  
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
      const filePath = `public/${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
      
      const { error: uploadError } = await supabase.storage.from(HKI_BUCKET).upload(filePath, file);
      
      if (uploadError) {
        await supabase.from(HKI_TABLE).delete().eq('id_hki', newHki.id_hki);
        throw new Error(`Upload file gagal: ${uploadError.message}`);
      }

      const { error: updateError } = await supabase
        .from(HKI_TABLE)
        .update({ sertifikat_pdf: filePath })
        .eq('id_hki', newHki.id_hki);

      if (updateError) {
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