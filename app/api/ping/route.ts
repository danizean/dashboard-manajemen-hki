import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = createServiceRoleClient()
  try {
    const { data, error } = await supabase.from('hki').select('id_hki').limit(1)

    if (error) {
      return NextResponse.json({ ok: false, error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: 'Supabase project aktif ✅',
      data,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, err }, { status: 500 })
  }
}
