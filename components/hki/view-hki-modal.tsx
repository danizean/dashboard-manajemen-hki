// components/hki/view-hki-modal.tsx
'use client'

import React, { useCallback, memo, useMemo, ReactNode, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HKIEntry } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Eye, Paperclip, Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { getStatusStyle } from './hki-utils'
import { useMutation } from '@tanstack/react-query'
import { motion, Variants, AnimatePresence } from 'framer-motion'

interface DetailItemProps {
  label: string
  value?: string | number | null
  children?: ReactNode
  className?: string
}

interface ViewHKIModalProps {
  isOpen: boolean
  onClose: () => void
  entry: HKIEntry | null
}

const DetailItem = memo(
  ({ label, value, children, className }: DetailItemProps) => {
    const content =
      children ??
      (value === null || value === undefined || value === '' ? '-' : value)
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
        <dd className="text-base text-foreground break-words">{content}</dd>
      </div>
    )
  }
)
DetailItem.displayName = 'DetailItem'

// ✅ FIX: Service diubah untuk secara eksplisit meminta URL 'inline'
const getCertificateUrl = async ({
  hkiId,
  disposition,
}: {
  hkiId: number
  disposition: 'inline' | 'attachment'
}) => {
  const url = `/api/hki/${hkiId}/signed-url?disposition=${disposition}`
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Gagal mendapatkan URL.')
  }
  return data
}

export const ViewHKIModal = memo(
  ({ isOpen, onClose, entry }: ViewHKIModalProps) => {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)

    const { mutate: fetchPdfUrl, isPending: isLoadingPdf } = useMutation({
      mutationFn: getCertificateUrl,
      onSuccess: (data) => {
        setPdfUrl(data.signedUrl)
        toast.success('Sertifikat berhasil dimuat.')
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : 'Gagal memuat sertifikat.'
        )
      },
    })

    const handleTogglePdfView = useCallback(() => {
      if (pdfUrl) {
        setPdfUrl(null)
        return
      }
      if (entry?.id_hki) {
        // ✅ FIX: Memastikan kita meminta versi 'inline' untuk ditampilkan
        fetchPdfUrl({ hkiId: entry.id_hki, disposition: 'inline' })
      }
    }, [entry, fetchPdfUrl, pdfUrl])

    const handleClose = () => {
      onClose()
      setTimeout(() => {
        setPdfUrl(null)
      }, 300)
    }

    const statusStyle = useMemo(
      () => getStatusStyle(entry?.status_hki?.nama_status),
      [entry?.status_hki?.nama_status]
    )
    const StatusIcon = statusStyle.icon

    if (!entry) {
      return null
    }

    const itemVariants: Variants = {
      hidden: { y: 20, opacity: 0 },
      visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.4, ease: 'easeOut' },
      },
    }

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-3xl p-0 flex flex-col max-h-[90vh]">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <DialogHeader className="flex flex-row items-start gap-4 px-6 py-4 border-b">
              <div className="bg-primary/10 p-2.5 rounded-lg flex-shrink-0">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-semibold break-words">
                  {entry.nama_hki}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Detail lengkap untuk data pengajuan HKI. Data tahun{' '}
                  {entry.tahun_fasilitasi || 'N/A'}.
                </DialogDescription>
              </div>
            </DialogHeader>
          </motion.div>

          <motion.div
            className="flex-1 overflow-y-auto"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1, delayChildren: 0.2 },
              },
            }}
            initial="hidden"
            animate="visible"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6">
              <motion.dl className="space-y-6" variants={itemVariants}>
                <DetailItem label="Nama HKI" value={entry.nama_hki} />
                <DetailItem label="Jenis Produk" value={entry.jenis_produk} />
                <DetailItem label="Jenis HKI">
                  <Badge
                    variant="outline"
                    className="font-medium bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 w-fit"
                  >
                    {entry.jenis?.nama_jenis_hki || '-'}
                  </Badge>
                </DetailItem>
                <DetailItem label="Kelas HKI (Nice)">
                  {entry.kelas ? (
                    <div className="flex flex-col items-start gap-1.5">
                      <Badge
                        variant="secondary"
                        className="font-normal bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 w-fit"
                      >
                        Kelas {entry.kelas.id_kelas} ({entry.kelas.tipe})
                      </Badge>
                      <p className="text-sm text-muted-foreground italic">
                        &quot;{entry.kelas.nama_kelas}&quot;
                      </p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">
                      - Tidak diatur -
                    </span>
                  )}
                </DetailItem>
              </motion.dl>

              <motion.dl className="space-y-6" variants={itemVariants}>
                <DetailItem
                  label="Pemohon"
                  value={entry.pemohon?.nama_pemohon}
                />
                <DetailItem label="Alamat Pemohon">
                  <p className="text-base text-foreground whitespace-pre-wrap">
                    {entry.pemohon?.alamat || '-'}
                  </p>
                </DetailItem>
                <DetailItem
                  label="Pengusul (OPD)"
                  value={entry.pengusul?.nama_opd}
                />
                <DetailItem label="Status Saat Ini">
                  <Badge
                    className={cn(
                      'text-base font-medium gap-2 px-3 py-1 w-fit',
                      statusStyle.className
                    )}
                  >
                    <StatusIcon className="h-4 w-4" />
                    {entry.status_hki?.nama_status || 'N/A'}
                  </Badge>
                </DetailItem>
              </motion.dl>

              <motion.dl
                className="md:col-span-2 grid grid-cols-1 gap-x-8 gap-y-6"
                variants={itemVariants}
              >
                <DetailItem label="Keterangan Tambahan">
                  <p className="text-base text-foreground whitespace-pre-wrap">
                    {entry.keterangan || '-'}
                  </p>
                </DetailItem>
              </motion.dl>
            </div>

            {/* Bagian Sertifikat PDF */}
            <div className="px-6 pb-6">
              <div className="border-t pt-6">
                <DetailItem label="Sertifikat PDF">
                  {entry.sertifikat_pdf ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 w-fit"
                      onClick={handleTogglePdfView}
                      disabled={isLoadingPdf}
                    >
                      {isLoadingPdf ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : pdfUrl ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      {isLoadingPdf
                        ? 'Memuat...'
                        : pdfUrl
                          ? 'Sembunyikan Sertifikat'
                          : 'Lihat Sertifikat'}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                      <Paperclip className="h-4 w-4" />
                      <span>Tidak ada file terlampir.</span>
                    </div>
                  )}
                </DetailItem>

                <AnimatePresence>
                  {(isLoadingPdf || pdfUrl) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{
                        height: '70vh',
                        opacity: 1,
                        marginTop: '1.5rem',
                      }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      {isLoadingPdf ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground rounded-lg border bg-muted/50">
                          <Loader2 className="h-8 w-8 animate-spin mb-4" />
                          <p>Memuat pratinjau sertifikat...</p>
                        </div>
                      ) : pdfUrl ? (
                        <iframe
                          src={pdfUrl}
                          className="w-full h-full rounded-md border"
                          title={`Sertifikat untuk ${entry.nama_hki}`}
                        />
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <DialogFooter className="px-6 py-4 border-t bg-muted/40 sm:justify-end">
              <Button variant="outline" onClick={handleClose}>
                Tutup
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }
)
ViewHKIModal.displayName = 'ViewHKIModal'
