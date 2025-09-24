'use client'

import React, { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DataTable } from '@/components/hki/data-table'
import { EditHKIModal } from '@/components/hki/edit-hki-modal'
import { CreateHKIModal } from '@/components/hki/create-hki-modal'
import { ViewHKIModal } from '@/components/hki/view-hki-modal'
import { HKIEntry, FormOptions } from '@/lib/types'
import { toast } from 'sonner'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'

interface HKIClientPageProps {
  formOptions: Readonly<FormOptions>
  error: string | null
}

const fetchHkiData = async (searchParams: URLSearchParams) => {
  const response = await fetch(`/api/hki?${searchParams.toString()}`)
  if (!response.ok) {
    try {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Gagal mengambil data HKI')
    } catch (e) {
      throw new Error(`Terjadi kesalahan jaringan atau server. Status: ${response.status}`)
    }
  }
  return response.json()
}

const ServerErrorDisplay = ({ errorMessage, onRetry }: { errorMessage: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-destructive bg-red-50 p-12 text-center dark:bg-red-950/30">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
      <AlertTriangle className="h-8 w-8 text-destructive" />
    </div>
    <h3 className="mt-4 text-2xl font-semibold tracking-tight text-destructive">Gagal Memuat Data</h3>
    <p className="mt-2 text-sm text-muted-foreground">Terjadi kesalahan saat berkomunikasi dengan server.</p>
    <code className="my-4 rounded bg-red-100 p-2 text-xs text-red-800 dark:bg-red-900 dark:text-red-200">{errorMessage}</code>
    <Button onClick={onRetry}><RefreshCw className="mr-2 h-4 w-4" />Coba Lagi</Button>
  </div>
)

const PageHeader = ({ totalCount, pageSize, pageIndex }: { totalCount: number; pageSize: number; pageIndex: number }) => {
  const start = totalCount > 0 ? pageIndex * pageSize + 1 : 0
  const end = Math.min((pageIndex + 1) * pageSize, totalCount)
  
  return (
    <div>
      {/* ✅ NAVIGASI BREADCRUMB DIHAPUS DARI SINI */}
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Manajemen Data Pengajuan Fasilitasi HKI</h1>
      {totalCount > 0 && 
        <p className="mt-2 text-muted-foreground">
          Menampilkan {start} - {end} dari total {totalCount} data.
        </p>
      }
    </div>
  )
}

export function HKIClientPage({ formOptions, error: serverError }: HKIClientPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['hkiData', searchParams.toString()],
    queryFn: () => fetchHkiData(new URLSearchParams(searchParams.toString())),
    placeholderData: (previousData) => previousData,
    retry: 1,
  });

  const { data: hkiData = [], totalCount = 0 } = data || {};

  const isCreateModalOpen = searchParams.get('create') === 'true'
  const editingHkiId = useMemo(() => Number(searchParams.get('edit')) || null, [searchParams])
  const viewingEntryId = useMemo(() => Number(searchParams.get('view')) || null, [searchParams])
  
  const pagination = useMemo(() => ({
    pageIndex: Number(searchParams.get('page') ?? 1) - 1,
    pageSize: Number(searchParams.get('pageSize') ?? 50),
  }), [searchParams])

  const viewingEntry = useMemo(() => {
    if (!viewingEntryId) return null;
    return hkiData.find((item: HKIEntry) => item.id_hki === viewingEntryId) || null;
  }, [viewingEntryId, hkiData])

  const isFiltered = useMemo(() => {
      const relevantFilters = ['search', 'jenisId', 'statusId', 'year', 'pengusulId'];
      return relevantFilters.some(key => searchParams.has(key) && searchParams.get(key) !== '');
  }, [searchParams]);

  const updateQueryString = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      value === null ? params.delete(key) : params.set(key, value);
    });
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleOpenCreateModal = () => updateQueryString({ create: 'true', edit: null, view: null });
  const handleEdit = (id: number) => updateQueryString({ edit: String(id), create: null, view: null });
  const handleViewDetails = (entry: HKIEntry) => updateQueryString({ view: String(entry.id_hki), create: null, edit: null });
  const handleCloseModals = () => updateQueryString({ create: null, edit: null, view: null });

  const onMutationSuccess = (message: string) => {
    handleCloseModals();
    toast.success(message);
    refetch();
  }

  const handleError = (message = 'Terjadi kesalahan') => toast.error(message)
  
  if (serverError || (error && !isFetching)) {
    return <ServerErrorDisplay errorMessage={serverError || error?.message || 'Unknown error'} onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-6">
      <PageHeader totalCount={totalCount} pageSize={pagination.pageSize} pageIndex={pagination.pageIndex} />

      <DataTable
        data={hkiData}
        totalCount={totalCount}
        formOptions={formOptions}
        onEdit={handleEdit}
        onOpenCreateModal={handleOpenCreateModal}
        onViewDetails={handleViewDetails}
        isLoading={isLoading || isFetching}
        isFiltered={isFiltered}
      />

      <EditHKIModal key={`edit-${editingHkiId}`} isOpen={!!editingHkiId} hkiId={editingHkiId} onClose={handleCloseModals} onSuccess={(item) => onMutationSuccess(`Data "${item.nama_hki}" berhasil diperbarui.`)} onError={handleError} formOptions={formOptions} />
      <CreateHKIModal isOpen={isCreateModalOpen} onClose={handleCloseModals} onSuccess={(item) => onMutationSuccess(`Data "${item.nama_hki}" berhasil dibuat.`)} onError={handleError} formOptions={formOptions} />
      <ViewHKIModal isOpen={!!viewingEntry} onClose={handleCloseModals} entry={viewingEntry} />
    </div>
  )
}