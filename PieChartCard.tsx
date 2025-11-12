'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const data = [
  { name: 'Completed', value: 124 },
  { name: 'Remaining', value: 76 },
]

const COLORS = ['#10b981', '#1f2937']

export default function PieChartCard() {
  const total = data.reduce((a, b) => a + b.value, 0)
  const pct = Math.round((data[0].value / total) * 100)

  return (
    <div className="card bg-slate-900/60 border border-slate-800 rounded-2xl p-4 h-80">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-slate-100">
          Degree Progress
        </h2>
        <div className="px-2 py-1 text-xs rounded-full bg-slate-800 text-slate-200">
          {pct}% complete
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={90}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
