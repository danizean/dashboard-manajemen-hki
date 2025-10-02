// components/dashboard/hki-status-chart.tsx
'use client'

import * as React from 'react'
import { Label, Pie, PieChart, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'

// Definisikan tipe props agar lebih jelas
interface HkiStatusChartProps {
  data: {
    name: string
    count: number
    fill: string
  }[]
}

export function HkiStatusChart({ data }: HkiStatusChartProps) {
  // Hitung total dari semua data untuk ditampilkan di tengah chart
  const totalCount = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.count, 0)
  }, [data])

  // Buat ChartConfig dari data yang masuk agar legend dan tooltip dinamis
  const chartConfig = React.useMemo(() => {
    return data.reduce((acc, item) => {
      acc[item.name] = {
        label: item.name,
        color: item.fill,
      }
      return acc
    }, {} as ChartConfig)
  }, [data])

  return (
    <Card className="flex flex-col h-full shadow-sm dark:border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Distribusi Status HKI
        </CardTitle>
        <CardDescription>
          Proporsi jumlah pengajuan HKI berdasarkan statusnya saat ini.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="count"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
              aria-label="Grafik donat distribusi status HKI"
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalCount.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground"
                        >
                          Total
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
              {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="-mt-4"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}