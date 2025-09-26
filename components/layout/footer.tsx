// components/layout/footer.tsx
'use client'

import React from 'react'

interface FooterProps {
  companyName?: string
}

/**
 * Komponen Footer yang konsisten dengan tema aplikasi.
 * @param companyName Nama perusahaan/organisasi. Default: "Bappeda Sleman".
 */
export function Footer({ companyName = 'Bappeda Sleman' }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    // PERBAIKAN: Menggunakan variabel tema dari globals.css untuk warna dan border
    // - `border-border` untuk garis pemisah
    // - `bg-card` atau `bg-background` untuk latar belakang
    // - `text-muted-foreground` untuk teks sekunder
    <footer className="w-full shrink-0 border-t border-border bg-card px-4 py-4 text-center md:px-6 2xl:px-10">
      <p className="text-sm text-muted-foreground">
        &copy; {currentYear} {companyName}. Hak Cipta Dilindungi.
      </p>
    </footer>
  )
}
