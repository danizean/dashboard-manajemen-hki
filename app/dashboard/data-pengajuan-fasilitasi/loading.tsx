// app/dashboard/data-pengajuan-fasilitasi/loading.tsx
// IMPROVEMENT: Membuat skeleton loader yang lebih detail dan representatif.
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Skeleton untuk Page Header */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-3/5 rounded-lg" />
        <Skeleton className="h-5 w-2/5 rounded-md" />
      </div>

      {/* Skeleton untuk Toolbar (Filter Card) */}
      <Card>
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Skeleton className="h-10 w-full md:max-w-md rounded-lg" />
            <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center justify-end gap-3">
              <Skeleton className="h-10 w-full sm:w-32 rounded-md" />
              <Skeleton className="h-10 w-full sm:w-32 rounded-md" />
              <Skeleton className="h-10 w-full sm:w-36 rounded-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <Skeleton className="h-5 w-48 rounded-md" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton untuk Tabel Data */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50 hidden md:table-header-group">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 p-2">
                <Skeleton className="h-5 w-5" />
              </TableHead>
              <TableHead className="w-[50px] p-2">
                <Skeleton className="h-5 w-3/4 mx-auto" />
              </TableHead>
              <TableHead className="w-60 p-2">
                <Skeleton className="h-5 w-4/5" />
              </TableHead>
              <TableHead className="w-52 p-2">
                <Skeleton className="h-5 w-4/5" />
              </TableHead>
              <TableHead className="w-44 p-2">
                <Skeleton className="h-5 w-4/5" />
              </TableHead>
              <TableHead className="w-52 p-2">
                <Skeleton className="h-5 w-4/5" />
              </TableHead>
              <TableHead className="w-24 p-2">
                <Skeleton className="h-5 w-3/4 mx-auto" />
              </TableHead>
              <TableHead className="w-64 p-2">
                <Skeleton className="h-5 w-4/5" />
              </TableHead>
              <TableHead className="w-40 p-2">
                <Skeleton className="h-5 w-4/5" />
              </TableHead>
              <TableHead className="w-20 p-2">
                <Skeleton className="h-5 w-4/5 ml-auto" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Skeleton untuk Desktop */}
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow
                key={`desktop-skeleton-${i}`}
                className="hidden md:table-row"
              >
                <TableCell className="p-2">
                  <Skeleton className="h-5 w-5" />
                </TableCell>
                <TableCell className="p-2">
                  <Skeleton className="h-5 w-8 mx-auto" />
                </TableCell>
                <TableCell className="p-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </TableCell>
                <TableCell className="p-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </TableCell>
                <TableCell className="p-2">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </TableCell>
                <TableCell className="p-2">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell className="p-2">
                  <Skeleton className="h-5 w-12 mx-auto" />
                </TableCell>
                <TableCell className="p-2">
                  <Skeleton className="h-8 w-full" />
                </TableCell>
                <TableCell className="p-2">
                  <Skeleton className="h-8 w-24" />
                </TableCell>
                <TableCell className="p-2 text-right">
                  <Skeleton className="h-8 w-8 ml-auto rounded-md" />
                </TableCell>
              </TableRow>
            ))}
            {/* Skeleton untuk Mobile */}
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={`mobile-skeleton-${i}`} className="md:hidden">
                <td colSpan={10} className="p-2">
                  <Skeleton className="h-32 w-full rounded-lg" />
                </td>
              </tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
