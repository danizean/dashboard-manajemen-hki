// components/dashboard/hki-chart.tsx
'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
  Cell,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface HkiChartProps {
  data: {
    year: number
    count: number
  }[]
}

const barColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const chartConfig = {
  pendaftaran: {
    label: 'Jumlah Pendaftaran',
  },
} satisfies ChartConfig

export function HkiChart({ data }: HkiChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 30, right: 10, left: 0, bottom: 0 }}
          aria-label="Grafik pendaftaran HKI per tahun"
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            className="stroke-border/50"
          />

          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs text-muted-foreground"
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={30}
            allowDecimals={false}
            className="text-xs text-muted-foreground"
          />

          <ChartTooltip
            cursor={{ fill: 'hsl(var(--accent))', radius: 4 }}
            content={
              <ChartTooltipContent
                // ✅ PERBAIKAN: Mengambil tahun langsung dari 'payload' yang berisi data lengkap
                labelFormatter={(_, payload) => {
                  return `Tahun ${payload[0]?.payload.year}`
                }}
                indicator="dot"
              />
            }
          />

          <Bar
            dataKey="count"
            name={chartConfig.pendaftaran.label}
            radius={[4, 4, 0, 0]}
          >
            <LabelList
              position="top"
              offset={8}
              className="fill-foreground text-xs"
              formatter={(value: number) => (value > 0 ? value : '')}
            />
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}