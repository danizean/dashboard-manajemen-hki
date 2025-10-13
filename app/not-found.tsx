// app/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button' // Asumsi Anda punya komponen Button

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4 text-center">
      <h1 className="text-8xl font-bold text-primary">404</h1>
      <h2 className="text-2xl font-semibold tracking-tight">
        Halaman Tidak Ditemukan
      </h2>
      <p className="max-w-md text-muted-foreground">
        Maaf, kami tidak dapat menemukan halaman yang Anda cari. Mungkin URL-nya
        salah atau halamannya sudah dipindahkan.
      </p>
      <Button asChild>
        <Link href="/dashboard">Kembali ke Dashboard</Link>
      </Button>
    </div>
  )
}