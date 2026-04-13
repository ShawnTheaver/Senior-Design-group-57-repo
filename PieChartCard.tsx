'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'

interface PieChartCardProps {
  progress?: number // percent (0–100)
}

export default function PieChartCard({ progress = 0 }: PieChartCardProps) {
  // Ensure we handle undefined or string values
  const pct = typeof progress === 'string' ? parseFloat(progress) || 0 : progress
  const safeProgress = Math.min(Math.max(pct, 0), 100)

  const data = [
    { name: 'Completed', value: safeProgress },
    { name: 'Remaining', value: 100 - safeProgress },
  ]

  // Debugging
  console.log('Degree Progress:', safeProgress)

  // Dynamic color — more color contrast
  const COLORS = ['#34d399', '#1f2937'] // bright green + dark gray

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
      <h3 className="text-lg font-semibold mb-3 text-white">Degree Progress</h3>

      <div className="flex flex-col items-center justify-center">
        <div className="w-full h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="85%"
                startAngle={90}
                endAngle={-270}
                stroke="none"
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    className="transition-all duration-300 hover:opacity-90"
                  />
                ))}
              </Pie>
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ marginTop: '1rem', color: '#cbd5e1' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <p className="text-slate-300 mt-3 text-sm font-medium">
          {safeProgress}% complete
        </p>
      </div>
    </div>
  )
}
