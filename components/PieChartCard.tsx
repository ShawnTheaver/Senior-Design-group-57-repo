// components/PieChartCard.tsx
'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

type Props = {
  percent: number // 0–100
  title?: string
}

export default function PieChartCard({ percent, title = 'Degree Progress' }: Props) {
  const value = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0))

  const data = useMemo(
    () => [
      { name: 'Completed', value },
      { name: 'Remaining', value: 100 - value },
    ],
    [value]
  )

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      <h2 className="text-base font-semibold mb-3">{title}</h2>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={-270}
              outerRadius={90}
              innerRadius={60}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((d, i) => (
                <Cell key={d.name + i} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-sm text-slate-300">{value}% complete</div>
    </div>
  )
}
