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
 */
function triggerBrowserDownload(blob: Blob, filename: string) {
  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = blobUrl
  link.setAttribute('download', filename)
  document.body.appendChild(link)

  link.click()

  // cleanup
  document.body.removeChild(link)
  window.URL.revokeObjectURL(blobUrl)
}

/**
 * Mengunduh data HKI yang telah difilter dengan notifikasi loading/success/error.
 */
export function downloadFilteredExport({
  format,
  filters,
}: ExportParams): void {
  const promise = (): Promise<void> =>
    new Promise((resolve, reject) => {
      (async () => {
        try {
          const queryParams = new URLSearchParams({ format })
          for (const [key, value] of Object.entries(filters)) {
            if (value) queryParams.set(key, String(value))
          }

          const url = `/api/hki/export?${queryParams.toString()}`
          const response = await fetch(url)

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({
              error: `Gagal mengunduh file. Server merespons dengan status ${response.status}.`,
            }))
            return reject(
              new Error(errorData.error || 'Terjadi kesalahan pada server.')
            )
          }

          const blob = await response.blob()

          const disposition = response.headers.get('Content-Disposition') || ''
          let filename = `hki-export-${new Date().toISOString().split('T')[0]}.${format}`
          const match = disposition.match(
            /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
          )
          if (match && match[1]) {
            filename = match[1].replace(/['"]/g, '')
          }

          triggerBrowserDownload(blob, filename)
          resolve()
        } catch (error) {
          console.error('Kesalahan pada layanan ekspor:', error)
          reject(
            error instanceof Error
              ? error
              : new Error('Gagal mengunduh file karena masalah jaringan.')
          )
        }
      })()
    })

  toast.promise(promise(), {
    loading: 'Sedang mempersiapkan file unduhan...',
    success: 'File berhasil diunduh! Proses dimulai di browser Anda.',
    error: (err: Error) => err.message || 'Gagal mengunduh file.',
  })
}