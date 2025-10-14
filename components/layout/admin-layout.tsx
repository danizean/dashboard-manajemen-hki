// app/components/layout/admin-layout.tsx
'use client'

import React, { useState, useCallback } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './navbar'
import { Footer } from './footer'

// --- Komponen Layout Utama (Tanpa Error Boundary Kustom) ---
export function AdminLayout({ children }: React.PropsWithChildren) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  return (
    <div className="flex min-h-screen bg-muted/40 text-foreground">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        aria-expanded={sidebarOpen}
      />

      <div className="flex flex-1 flex-col transition-all duration-300 ease-in-out">
        <Topbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={handleToggleSidebar}
        />

        <main
          role="main"
          className="flex-1 focus:outline-none"
          aria-label="Konten utama"
        >
          <div className="mx-auto w-full max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {children}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
