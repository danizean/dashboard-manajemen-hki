'use client'

import dynamic from 'next/dynamic'
import Loading from './loading'
import { FormOptions } from '@/lib/types'

// Ini adalah Client Component yang tugasnya melakukan dynamic import
const HKIClientPage = dynamic(() => import('./hki-client-page'), {
  ssr: false, // 'ssr: false' diizinkan di sini karena ini adalah Client Component
  loading: () => <Loading />,
})

// Komponen loader ini hanya akan meneruskan props
export default function HkiPageLoader({
  formOptions,
  error,
}: {
  formOptions: FormOptions
  error: string | null
}) {
  return <HKIClientPage formOptions={formOptions} error={error} />
}
