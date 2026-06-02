'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface DataPoint {
  date: string
  roi: number
  index: number
}

interface Props {
  data: DataPoint[]
}

export function RoiChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0f1829',
            border: '1px solid #1e2d45',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelStyle={{ color: '#f1f5f9' }}
          formatter={(value) => [typeof value === 'number' ? `${value.toFixed(1)}%` : value, 'ROI']}
        />
        <ReferenceLine y={60} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1} />
        <ReferenceLine y={30} stroke="#eab308" strokeDasharray="3 3" strokeWidth={1} />
        <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
        <Line
          type="monotone"
          dataKey="roi"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ fill: '#22c55e', r: 3 }}
          activeDot={{ r: 5, fill: '#22c55e' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
