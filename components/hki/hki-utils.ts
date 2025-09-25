'use client'

import { CheckCircle, BookCheck, XCircle, Clock, type LucideIcon } from 'lucide-react'

// ✨ REFACTOR: Gunakan 'as const' untuk membuat object ini read-only
// dan memungkinkan kita mengambil tipenya secara otomatis.
const STATUS_STYLES = {
  Diterima: { 
    className: 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300', 
    icon: CheckCircle 
  },
  Didaftar: { 
    className: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300', 
    icon: BookCheck 
  },
  Ditolak: { 
    className: 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300', 
    icon: XCircle 
  },
  'Dalam Proses': { 
    className: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', 
    icon: Clock 
  },
  Default: { 
    className: 'border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300', 
    icon: Clock 
  },
} as const; // `as const` adalah kuncinya

// ✨ REFACTOR: Tipe `KnownStatus` sekarang diambil secara otomatis dari keys object di atas.
// Jika Anda menambah status baru di STATUS_STYLES, tipe ini akan otomatis ter-update.
// Ini adalah "Single Source of Truth".
type KnownStatus = keyof typeof STATUS_STYLES;

// ✨ REFACTOR: Fungsi ini sekarang lebih type-safe tanpa 'as'.
// Ia memeriksa apakah statusName ada di dalam object sebelum mengaksesnya.
export const getStatusStyle = (statusName?: string) => {
  if (statusName && statusName in STATUS_STYLES) {
    // TypeScript sekarang tahu bahwa statusName adalah key yang valid.
    return STATUS_STYLES[statusName as KnownStatus];
  }
  return STATUS_STYLES.Default;
};