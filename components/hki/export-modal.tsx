'use client'

import React, { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// UI Components from shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { Skeleton } from '@/components/ui/skeleton'

// Icons
import {
  BookCheck,
  Building,
  CalendarDays,
  Loader2,
  Upload,
} from 'lucide-react'

// Services & Types
import { downloadFilteredExport } from '@/app/services/hki-service'
import { StatusHKI } from '@/lib/types'

// Helper Types
type ComboboxOption = { value: string; label: string }
type ExportFormat = 'csv' | 'xlsx'
type FilterType = 'year' | 'pengusul' | 'status'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  formOptions: {
    tahunOptions: { tahun: number }[]
    pengusulOptions: ComboboxOption[]
    statusOptions: StatusHKI[]
  }
  // ✅ NEW PROP: Untuk menampilkan skeleton loading saat options masih di-fetch
  isLoadingOptions?: boolean
}

// ✅ ZOD SCHEMA: Mendefinisikan struktur dan validasi form.
const exportSchema = z.object({
  filterBy: z.enum(['year', 'pengusul', 'status']),
  filterValue: z.string().min(1, { message: 'Nilai filter harus dipilih.' }),
  format: z.enum(['xlsx', 'csv']),
})

type ExportFormValues = z.infer<typeof exportSchema>

export function ExportModalRefactored({
  isOpen,
  onClose,
  formOptions,
  isLoadingOptions = false,
}: ExportModalProps) {
  // ✅ REACT-HOOK-FORM: Manajemen state form yang terpusat.
  const form = useForm<ExportFormValues>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      filterBy: 'year',
      filterValue: '',
      format: 'xlsx',
    },
  })

  const { control, handleSubmit, watch, reset, setValue } = form
  const watchedFilterBy = watch('filterBy')

  // Reset filterValue setiap kali filterBy berubah
  useEffect(() => {
    setValue('filterValue', '')
  }, [watchedFilterBy, setValue])

  // ✅ REACT QUERY (useMutation): Mengelola proses ekspor data.
  const exportMutation = useMutation({
    mutationFn: (values: ExportFormValues) => {
      const filters = {
        search: '',
        jenisId: '',
        statusId: values.filterBy === 'status' ? values.filterValue : '',
        year: values.filterBy === 'year' ? values.filterValue : '',
        pengusulId: values.filterBy === 'pengusul' ? values.filterValue : '',
      }
      return downloadFilteredExport({ format: values.format, filters })
    },
    onSuccess: () => {
      toast.success('Ekspor data berhasil!', {
        description: 'File akan segera terunduh.',
      })
      handleClose()
    },
    onError: (error) => {
      toast.error('Gagal mengekspor data', {
        description:
          error instanceof Error ? error.message : 'Terjadi kesalahan server.',
      })
    },
  })

  const onSubmit = (data: ExportFormValues) => {
    exportMutation.mutate(data)
  }

  const handleClose = () => {
    reset() // Reset form state saat modal ditutup
    onClose()
  }
  
  // Memoized options for performance
  const tahunOptions = React.useMemo(
    () =>
      formOptions.tahunOptions.map((y) => ({
        value: String(y.tahun),
        label: String(y.tahun),
      })),
    [formOptions.tahunOptions]
  )

  const renderFilterInput = () => {
    switch (watchedFilterBy) {
      case 'year':
        return (
          <Controller
            name="filterValue"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tahun..." />
                </SelectTrigger>
                <SelectContent>
                  {tahunOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )
      case 'pengusul':
        return (
          <Controller
            name="filterValue"
            control={control}
            render={({ field }) => (
              <Combobox
                options={formOptions.pengusulOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Pilih OPD pengusul..."
                searchPlaceholder="Cari OPD..."
              />
            )}
          />
        )
      case 'status':
        return (
          <Controller
            name="filterValue"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status HKI..." />
                </SelectTrigger>
                <SelectContent>
                  {formOptions.statusOptions.map((opt) => (
                    <SelectItem
                      key={opt.id_status}
                      value={String(opt.id_status)}
                    >
                      {opt.nama_status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )
      default:
        return null
    }
  }
  
  const renderContent = () => {
    if (isLoadingOptions) {
      return (
        <div className="py-4 space-y-6">
            <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
            <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-48" />
            </div>
        </div>
      )
    }

    return (
       <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="py-4 space-y-6">
          <Controller
            name="filterBy"
            control={control}
            render={({ field }) => (
              <div className="space-y-3">
                <Label className="font-semibold">1. Ekspor Berdasarkan</Label>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3" // ✅ RESPONSIVE
                >
                  {[
                    { value: 'year', label: 'Tahun', icon: CalendarDays },
                    { value: 'pengusul', label: 'Pengusul', icon: Building },
                    { value: 'status', label: 'Status', icon: BookCheck },
                  ].map(({ value, label, icon: Icon }) => (
                    <div key={value}>
                      <RadioGroupItem value={value} id={value} className="sr-only" />
                      <Label
                        htmlFor={value}
                        className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer transition-all duration-200"
                      >
                        <Icon className="mb-2 h-6 w-6" />
                        {label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          />

          <div className="space-y-3">
            <Label htmlFor="filter-value" className="font-semibold">
              2. Pilih Nilai Filter
            </Label>
            {renderFilterInput()}
             {form.formState.errors.filterValue && <p className="text-sm text-red-500">{form.formState.errors.filterValue.message}</p>}
          </div>

          <Controller
            name="format"
            control={control}
            render={({ field }) => (
              <div className="space-y-3">
                <Label className="font-semibold">3. Pilih Format File</Label>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex items-center space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="xlsx" id="xlsx" />
                    <Label htmlFor="xlsx" className="cursor-pointer">Excel (.xlsx)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="csv" />
                    <Label htmlFor="csv" className="cursor-pointer">CSV (.csv)</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          />
        </div>
      </form>
    )
  }

  return (
    // ✅ FRAMER MOTION: Animasi exit memerlukan AnimatePresence
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent asChild className="sm:max-w-lg">
            {/* Wrapper untuk animasi */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="text-xl">Ekspor Data HKI</DialogTitle>
                <DialogDescription>
                  Pilih kriteria dan format untuk mengunduh data.
                </DialogDescription>
              </DialogHeader>

              {renderContent()}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={exportMutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSubmit(onSubmit)}
                  disabled={!form.formState.isValid || exportMutation.isPending}
                >
                  {exportMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {exportMutation.isPending ? 'Memproses...' : 'Ekspor Data'}
                </Button>
              </DialogFooter>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}