'use client'

type StatCardProps = {
  title: string
  value: string
  sub: string
  badge: string
}

export default function StatCard({ title, value, sub, badge }: StatCardProps) {
  return (
    <div className="card bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
          <div className="mt-1 text-2xl font-bold text-slate-50">{value}</div>
          <div className="text-xs text-slate-500">{sub}</div>
        </div>
        <div className="px-2 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400">
          {badge}
        </div>
      </div>
    </div>
  )
}
