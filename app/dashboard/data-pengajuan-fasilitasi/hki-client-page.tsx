'use client'

import React, { useMemo, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { DataTable } from '@/components/hki/data-table'
import { HKIEntry, FormOptions } from '@/lib/types'
import { toast } from 'sonner'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query'
import { useHkiRealtime } from '@/hooks/useHkiRealtime'

const EditHKIModal = dynamic(() => import('@/components/hki/edit-hki-modal').then(mod => mod.EditHKIModal));
const CreateHKIModal = dynamic(() => import('@/components/hki/create-hki-modal').then(mod => mod.CreateHKIModal));
const ViewHKIModal = dynamic(() => import('@/components/hki/view-hki-modal').then(mod => mod.ViewHKIModal));


interface HKIClientPageProps {
  formOptions: Readonly<FormOptions>
  error: string | null
}

type HkiQueryData = { data: HKIEntry[]; totalCount: number };

const fetchHkiData = async (searchParams: URLSearchParams): Promise<HkiQueryData> => {
  const response = await fetch(`/api/hki?${searchParams.toString()}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Gagal mengambil data HKI')
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
  const queryClient = useQueryClient()
  
  useHkiRealtime();
  
  const queryKey = useMemo(() => ['hkiData', searchParams.toString()], [searchParams]);

  const { data, error, isLoading, isFetching, refetch } = useQuery<HkiQueryData>({
    queryKey,
    queryFn: () => fetchHkiData(new URLSearchParams(searchParams.toString())),
    placeholderData: (previousData) => previousData,
    retry: 1,
  });

  const { data: hkiData = [], totalCount = 0 } = data || {};
  
  const { mutate: deleteHkiEntries, isPending: isDeleting } = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await fetch('/api/hki/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menghapus entri.');
      return result;
    },
    onMutate: async (idsToDelete: number[]) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<HkiQueryData>(queryKey);

      queryClient.setQueryData<HkiQueryData>(queryKey, (oldData) => {
        if (!oldData) return { data: [], totalCount: 0 };
        const newData = oldData.data.filter(entry => !idsToDelete.includes(entry.id_hki));
        return {
          data: newData,
          totalCount: oldData.totalCount - idsToDelete.length,
        };
      });

      return { previousData };
    },
    onError: (err: Error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error(`Gagal menghapus: ${err.message}`);
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Entri berhasil dihapus!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: async ({ entryId, newStatusId }: { entryId: number, newStatusId: number }) => {
      const response = await fetch(`/api/hki/${entryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId: newStatusId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Gagal memperbarui status.' }));
        throw new Error(errorData.message || 'Gagal memperbarui status.');
      }
      return response.json();
    },
    onMutate: async ({ entryId, newStatusId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<HkiQueryData>(queryKey);

      queryClient.setQueryData<HkiQueryData>(queryKey, (oldData) => {
        if (!oldData) return { data: [], totalCount: 0 };
        return {
          ...oldData,
          data: oldData.data.map((entry) => 
            entry.id_hki === entryId
              ? { ...entry, status_hki: formOptions.statusOptions.find(s => s.id_status === newStatusId) || entry.status_hki }
              : entry
          ),
        };
      });

      return { previousData };
    },
    onError: (err: Error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error(`Gagal memperbarui status: ${err.message}`);
    },
    onSuccess: (data) => {
      toast.success(data.message || "Status berhasil diperbarui!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

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

  const updateQueryString = useCallback((newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      value === null ? params.delete(key) : params.set(key, value);
    });
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const handleOpenCreateModal = () => updateQueryString({ create: 'true', edit: null, view: null });
  const handleEdit = (id: number) => updateQueryString({ edit: String(id), create: null, view: null });
  const handleViewDetails = (entry: HKIEntry) => updateQueryString({ view: String(entry.id_hki), create: null, edit: null });
  const handleCloseModals = () => updateQueryString({ create: null, edit: null, view: null });

  const onMutationSuccess = useCallback((message: string, newItem: HKIEntry, mode: 'create' | 'edit') => {
    handleCloseModals();
    toast.success(message);
    
    queryClient.setQueryData<HkiQueryData>(queryKey, (oldData) => {
      if (!oldData) return { data: [newItem], totalCount: 1 };
      
      if (mode === 'create') {
        return {
          data: [newItem, ...oldData.data],
          totalCount: oldData.totalCount + 1
        };
      }
      if (mode === 'edit') {
        return {
          ...oldData,
          data: oldData.data.map(item => item.id_hki === newItem.id_hki ? newItem : item)
        };
      }
      return oldData;
    });
    
    queryClient.invalidateQueries({ queryKey });

  }, [queryClient, queryKey, handleCloseModals]);


  const handleError = (message = 'Terjadi kesalahan') => toast.error(message)
  
  if (serverError || (error && !isFetching)) {
    return <ServerErrorDisplay errorMessage={serverError || error?.message || 'Unknown error'} onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-6">
      {isFetching && !isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 z-50">
          <div className="h-full bg-primary/50 animate-pulse w-full" />
        </div>
      )}

      <PageHeader totalCount={totalCount} pageSize={pagination.pageSize} pageIndex={pagination.pageIndex} />

      <DataTable
        data={hkiData}
        totalCount={totalCount}
        formOptions={formOptions}
        onEdit={handleEdit}
        onOpenCreateModal={handleOpenCreateModal}
        onViewDetails={handleViewDetails}
        // ✅ PERBAIKAN: Menambahkan tipe eksplisit pada parameter
        onStatusUpdate={(entryId: number, newStatusId: number) => updateStatus({ entryId, newStatusId })}
        onDelete={deleteHkiEntries}
        isDeleting={isDeleting}
        isLoading={isLoading}
      />

      <Suspense fallback={null}>
        {editingHkiId && <EditHKIModal key={`edit-${editingHkiId}`} isOpen={!!editingHkiId} hkiId={editingHkiId} onClose={handleCloseModals} onSuccess={(item) => onMutationSuccess(`Data "${item.nama_hki}" berhasil diperbarui.`, item, 'edit')} onError={handleError} formOptions={formOptions} />}
        {isCreateModalOpen && <CreateHKIModal isOpen={isCreateModalOpen} onClose={handleCloseModals} onSuccess={(item) => onMutationSuccess(`Data "${item.nama_hki}" berhasil dibuat.`, item, 'create')} onError={handleError} formOptions={formOptions} />}
        {viewingEntry && <ViewHKIModal isOpen={!!viewingEntry} onClose={handleCloseModals} entry={viewingEntry} />}
      </Suspense>
    </div>
  )
}

