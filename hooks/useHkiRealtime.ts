'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useQueryClient } from '@tanstack/react-query'
import { HKIEntry } from '@/lib/types'

/**
 * Hook kustom untuk berlangganan perubahan real-time pada tabel HKI di Supabase.
 * Ini akan secara otomatis memperbarui data di tabel ketika ada perubahan
 * dari pengguna lain atau proses backend.
 */
export function useHkiRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('hki_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hki' },
        (payload) => {
          console.log('Perubahan realtime terdeteksi:', payload)

          // Invalidate semua query yang berhubungan dengan 'hkiData'
          // Ini akan memicu React Query untuk me-refetch data secara otomatis.
          queryClient.invalidateQueries({ queryKey: ['hkiData'] })
        }
      )
      .subscribe()

    // Cleanup function untuk berhenti berlangganan saat komponen di-unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
