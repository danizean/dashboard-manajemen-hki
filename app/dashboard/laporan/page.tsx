// app/dashboard/laporan/page.tsx
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { TrendingUp, CheckCircle } from 'lucide-react'
import { HkiChart } from '@/components/dashboard/hki-chart'
import { HkiStatusChart } from '@/components/dashboard/hki-status-chart'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const STATUS_COLORS = {
  Diterima: 'hsl(var(--chart-2))',
  Didaftar: 'hsl(var(--chart-1))',
  'Dalam Proses': 'hsl(var(--chart-3))',
  Ditolak: 'hsl(var(--chart-5))',
  Default: 'hsl(var(--chart-4))',
} as const;

type KnownStatus = keyof typeof STATUS_COLORS;

const getStatusColor = (statusName: string | null): string => {
  if (statusName && statusName in STATUS_COLORS) {
    return STATUS_COLORS[statusName as KnownStatus];
  }
  return STATUS_COLORS.Default;
};

async function getReportData() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/dashboard?error=Akses_Ditolak');

  // ✅ PERBAIKAN: Mengganti panggilan RPC dengan kueri langsung.
  // Ini menghilangkan dependensi pada fungsi database kustom.
  const [yearly, byStatus] = await Promise.all([
    supabase.from('hki').select('tahun_fasilitasi'),
    supabase.from('status_hki').select(`nama_status, hki(count)`),
  ]);

  if (yearly.error || byStatus.error) {
    console.error('Gagal mengambil data laporan:', yearly.error || byStatus.error);
    // Tampilkan pesan eror yang lebih spesifik jika memungkinkan
    const errorMessage = yearly.error?.message || byStatus.error?.message || 'Unknown error';
    throw new Error(`Tidak dapat memuat data laporan dari database: ${errorMessage}`);
  }
  
  // Proses data tahunan dari kueri langsung
  const yearlyCounts: { [year: number]: number } = {};
  yearly.data?.forEach(item => {
    if (item.tahun_fasilitasi) {
      yearlyCounts[item.tahun_fasilitasi] = (yearlyCounts[item.tahun_fasilitasi] || 0) + 1;
    }
  });
  const chartData = Object.entries(yearlyCounts).map(([year, count]) => ({
    year: Number(year),
    count,
  })).sort((a, b) => a.year - b.year);

  // Proses data status (tidak berubah)
  const statusData = byStatus.data?.map(status => ({
    name: status.nama_status,
    count: (status.hki[0] as unknown as { count: number })?.count ?? 0,
    fill: getStatusColor(status.nama_status),
  })).sort((a, b) => b.count - a.count);

  return { chartData, statusData };
}

export default async function ReportPage() {
    try {
        const { chartData, statusData } = await getReportData();

        return (
            <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Laporan Statistik</h1>
                <p className="mt-1 text-muted-foreground">
                Ringkasan visual data pengajuan fasilitasi HKI.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                <Card className="h-full shadow-sm dark:border-gray-800">
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Pengajuan HKI per Tahun
                    </CardTitle>
                    <CardDescription>
                        Jumlah total pengajuan HKI yang difasilitasi setiap tahunnya.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <HkiChart data={chartData} />
                    </CardContent>
                </Card>
                </div>

                <div className="lg:col-span-2">
                <HkiStatusChart data={statusData || []} />
                </div>
            </div>
            </div>
        );
    } catch (error: any) {
        // Menampilkan pesan eror yang lebih informatif di halaman
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="w-full max-w-lg border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Gagal Memuat Laporan</CardTitle>
                        <CardDescription>
                            Terjadi kesalahan saat mengambil data dari server.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Detail Eror:</p>
                        <pre className="mt-2 p-3 bg-muted rounded-md text-xs text-destructive-foreground">
                            <code>{error.message}</code>
                        </pre>
                    </CardContent>
                </Card>
            </div>
        );
    }
}