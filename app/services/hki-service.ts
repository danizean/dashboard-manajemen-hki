import { toast } from 'sonner'

interface ActiveFilters {
  search?: string | null
  jenisId?: string | null
  statusId?: string | null
  year?: string | null
  pengusulId?: string | null
}

interface ExportParams {
  format: 'csv' | 'xlsx'
  filters: ActiveFilters
}

/**
 * Helper function untuk memicu unduhan file di browser dari blob.
 * @param blob - Data file dalam bentuk Blob.
 * @param filename - Nama file yang akan diunduh.
 */
function triggerBrowserDownload(blob: Blob, filename: string) {
  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = blobUrl
  link.setAttribute('download', filename)
  document.body.appendChild(link)

  link.click()

  // Membersihkan object URL dan elemen link setelah di-klik
  document.body.removeChild(link)
  window.URL.revokeObjectURL(blobUrl)
}

/**
 * Mengunduh data HKI yang telah difilter dengan menampilkan notifikasi loading, sukses, или error.
 * @param params - Obyek berisi format dan semua filter yang aktif.
 */
export async function downloadFilteredExport({
  format,
  filters,
}: ExportParams): Promise<void> {

  // ✅ PERBAIKAN: Membungkus logika fetch dalam new Promise yang eksplisit.
  // Ini memberikan kontrol penuh atas kapan promise dianggap 'reject' atau 'resolve',
  // yang sangat penting untuk toast.promise.
  const promise = (): Promise<void> =>
    new Promise(async (resolve, reject) => {
      try {
        const queryParams = new URLSearchParams({ format })
        for (const [key, value] of Object.entries(filters)) {
          if (value) {
            queryParams.set(key, String(value))
          }
        }

        const url = `/api/hki/export?${queryParams.toString()}`
        const response = await fetch(url)

        // ✅ PERBAIKAN: Penanganan error yang lebih tangguh.
        // Jika respons tidak OK (status 4xx atau 5xx), kita harus me-reject promise.
        if (!response.ok) {
          // Coba baca body sebagai JSON untuk mendapatkan pesan error yang lebih spesifik dari API.
          const errorData = await response.json().catch(() => {
            // Jika body bukan JSON (misal, error 502), buat pesan error generik.
            return { error: `Gagal mengunduh file. Server merespons dengan status ${response.status}.` }
          })
          // Tolak promise dengan pesan error yang jelas, yang akan ditangkap oleh toast.promise.
          return reject(new Error(errorData.error || 'Terjadi kesalahan pada server.'))
        }

        // Jika respons berhasil, lanjutkan proses seperti biasa.
        const blob = await response.blob()
        const disposition = response.headers.get('Content-Disposition') || ''
        const filenameMatch = disposition.match(/filename="(.+?)"/)
        const fallbackFilename = `hki-export-${new Date().toISOString().split('T')[0]}.${format}`
        const filename = filenameMatch ? filenameMatch[1] : fallbackFilename
        
        triggerBrowserDownload(blob, filename)
        
        // Selesaikan promise jika semua langkah berhasil.
        resolve()

      } catch (error) {
        // Tangkap error jaringan (misal: offline) atau error tak terduga lainnya.
        console.error("Kesalahan pada layanan ekspor:", error);
        // Tolak promise dengan error tersebut.
        reject(error instanceof Error ? error : new Error('Gagal mengunduh file karena masalah jaringan.'))
      }
    });

  // toast.promise sekarang akan menerima promise yang selalu di-reject dengan benar.
  toast.promise(promise(), {
    loading: 'Sedang mempersiapkan file unduhan...',
    success: 'File berhasil diunduh! Proses dimulai di browser Anda.',
    error: (err: Error) => err.message || 'Gagal mengunduh file.',
  })
}
