'use client'

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MasterCrudTable } from './master-crud-components'
import { JenisHKI, KelasHKI, Pengusul } from '@/lib/types'
import { Copyright, Building, FileText, type LucideIcon } from 'lucide-react'

export type MasterDataType = 'jenis_hki' | 'kelas_hki' | 'pengusul'
export type AnyMasterItem = JenisHKI | KelasHKI | Pengusul

type Config<T extends AnyMasterItem> = {
  title: string;
  description: string;
  icon: LucideIcon;
  columns: { key: keyof T; label: string }[];
  idKey: keyof T;
  nameKey: keyof T;
}

type MasterConfig = {
  jenis_hki: Config<JenisHKI>;
  kelas_hki: Config<KelasHKI>;
  pengusul: Config<Pengusul>;
}

export const masterConfig: MasterConfig = {
  jenis_hki: {
    title: 'Jenis HKI',
    description: 'Data referensi untuk tipe-tipe HKI yang tersedia.',
    icon: Copyright,
    columns: [
      { key: 'id_jenis_hki', label: 'ID' },
      { key: 'nama_jenis_hki', label: 'Nama Jenis' },
    ],
    idKey: 'id_jenis_hki',
    nameKey: 'nama_jenis_hki',
  },
  kelas_hki: {
    title: 'Kelas HKI',
    description: 'Data referensi 45 Kelas Merek (Nice Classification).',
    icon: FileText,
    columns: [
      { key: 'id_kelas', label: 'ID Kelas' },
      { key: 'nama_kelas', label: 'Nama Kelas' },
      { key: 'tipe', label: 'Tipe' },
    ],
    idKey: 'id_kelas',
    nameKey: 'nama_kelas',
  },
  pengusul: {
    title: 'Pengusul (OPD)',
    description: 'Data referensi Organisasi Perangkat Daerah (OPD) pengusul.',
    icon: Building,
    columns: [
      { key: 'id_pengusul', label: 'ID' },
      { key: 'nama_opd', label: 'Nama OPD' },
    ],
    idKey: 'id_pengusul',
    nameKey: 'nama_opd',
  },
}

interface MasterDataClientProps {
  initialData: {
    jenis_hki: JenisHKI[]
    kelas_hki: KelasHKI[]
    pengusul: Pengusul[]
  }
}

export function MasterDataClient({ initialData }: MasterDataClientProps) {
  const tabs = Object.keys(masterConfig) as MasterDataType[];

  return (
    <Tabs defaultValue={tabs[0]} className="w-full">
      <TabsList className={`grid w-full h-12 grid-cols-${tabs.length}`}>
        {tabs.map((tabKey) => {
          const config = masterConfig[tabKey];
          return (
            <TabsTrigger key={tabKey} value={tabKey} className="gap-2 text-base md:text-sm">
              <config.icon className="h-4 w-4" /> {config.title}
            </TabsTrigger>
          );
        })}
      </TabsList>
      
      {/* ✅ PERBAIKAN: Render setiap tabel secara eksplisit untuk menjaga type safety */}
      <TabsContent value="jenis_hki" className="mt-4">
        <MasterCrudTable
          dataType="jenis_hki"
          data={initialData.jenis_hki}
          config={masterConfig.jenis_hki}
        />
      </TabsContent>
      <TabsContent value="kelas_hki" className="mt-4">
        <MasterCrudTable
          dataType="kelas_hki"
          data={initialData.kelas_hki}
          config={masterConfig.kelas_hki}
        />
      </TabsContent>
      <TabsContent value="pengusul" className="mt-4">
        <MasterCrudTable
          dataType="pengusul"
          data={initialData.pengusul}
          config={masterConfig.pengusul}
        />
      </TabsContent>
    </Tabs>
  );
}
