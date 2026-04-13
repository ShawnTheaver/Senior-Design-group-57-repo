'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface PieChartCardProps {
  progress?: number
}

export default function PieChartCard({ progress = 0 }: PieChartCardProps) {
  const pct = typeof progress === 'string' ? parseFloat(progress) || 0 : progress
  const safeProgress = Math.min(Math.max(pct, 0), 100)

  const data = [
    { name: 'Completed', value: safeProgress },
    { name: 'Remaining', value: 100 - safeProgress },
  ]

  const COLORS = ['#2563eb', '#dbe4f0']

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Degree Progress</h3>
        <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          {safeProgress}% Complete
        </div>
      </div>

      <div className="flex flex-col items-center justify-center">
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="62%"
                outerRadius="82%"
                startAngle={90}
                endAngle={-270}
                stroke="none"
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex items-center gap-6 text-sm font-medium">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="h-3.5 w-3.5 rounded-sm bg-blue-600" />
            Completed
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span className="h-3.5 w-3.5 rounded-sm bg-slate-200" />
            Remaining
          </div>
        </div>

        <p className="mt-5 text-base font-semibold text-slate-700">
          {safeProgress}% complete
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Keep going — you are making steady progress.
        </p>
      </div>
    </div>
  )
}