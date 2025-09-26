//  app/providers.tsx
'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Buat instance client-nya sekali saja
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Opsi default untuk semua query
      staleTime: 1000 * 60 * 5, // 5 menit
      refetchOnWindowFocus: false, // Tidak fetch ulang saat window di-fokus
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
