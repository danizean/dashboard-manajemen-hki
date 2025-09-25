// app/dashboard/data-pengajuan-fasilitasi/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Skeleton untuk Page Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/2 rounded-md" />
        <Skeleton className="h-4 w-1/3 rounded-md" />
      </div>

      {/* Skeleton untuk Toolbar (Filter Card) */}
      <Skeleton className="h-[180px] w-full rounded-xl" />

      {/* Skeleton untuk Tabel Data */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {/* Hanya tampilkan satu baris header skeleton */}
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12"><Skeleton className="h-5 w-full" /></TableHead>
              <TableHead className="w-[50px]"><Skeleton className="h-5 w-full" /></TableHead>
              <TableHead className="w-60"><Skeleton className="h-5 w-full" /></TableHead>
              <TableHead className="w-52"><Skeleton className="h-5 w-full" /></TableHead>
              <TableHead className="w-44"><Skeleton className="h-5 w-full" /></TableHead>
              <TableHead><Skeleton className="h-5 w-full" /></TableHead>
              <TableHead className="w-24"><Skeleton className="h-5 w-full" /></TableHead>
              <TableHead className="w-20"><Skeleton className="h-5 w-full" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Buat 5 baris skeleton untuk merepresentasikan data */}
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                <TableCell><Skeleton className="h-5 w-5 rounded-sm" /></TableCell>
                <TableCell><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
                <TableCell><div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-3/4" /></div></TableCell>
                <TableCell><div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-3/4" /></div></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Skeleton untuk Pagination */}
        <div className="flex items-center justify-between p-4 border-t">
            <Skeleton className="h-5 w-32" />
            <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
            </div>
            <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </div>
  );
}