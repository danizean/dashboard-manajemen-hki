import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

type TableName = keyof Database['public']['Tables']

const TABLE_SAFELIST: TableName[] = ['jenis_hki', 'kelas_hki', 'pengusul']

async function isAdmin(supabase: any): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return profile?.role === 'admin'
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tableName: string } }
) {
  const { tableName } = params
  if (!TABLE_SAFELIST.includes(tableName as TableName)) {
    return NextResponse.json({ message: 'Tabel tidak valid' }, { status: 400 })
  }

  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
  }

  try {
    const body = await request.json()

    if (tableName === 'kelas_hki' && body.id_kelas) {
      const { data: existing } = await supabase
        .from('kelas_hki')
        .select('id_kelas')
        .eq('id_kelas', body.id_kelas)
        .single()
      if (existing) {
        return NextResponse.json({ message: `ID Kelas ${body.id_kelas} sudah digunakan.` }, { status: 409 })
      }
    }

    const { data, error } = await supabase
      .from(tableName as TableName)
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Error membuat data master:', error)
      // ✅ Penanganan error duplikasi data
      if (error.code === '23505') { // unique_violation
        return NextResponse.json({ message: 'Data dengan nama/ID tersebut sudah ada.' }, { status: 409 })
      }
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Data berhasil dibuat', data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}