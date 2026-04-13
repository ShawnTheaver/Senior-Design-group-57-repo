'use client'

type StatCardProps = {
  title: string
  value: string
  sub: string
  badge: string
}

function getBadgeClasses(badge: string) {
  const normalized = badge.toLowerCase()

  if (normalized.includes('catch')) {
    return 'bg-amber-100 text-amber-700'
  }

  if (normalized.includes('academic')) {
    return 'bg-blue-100 text-blue-700'
  }

  if (normalized.includes('keep')) {
    return 'bg-emerald-100 text-emerald-700'
  }

  return 'bg-slate-100 text-slate-700'
}

export default function StatCard({ title, value, sub, badge }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-600">{title}</h3>
          <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
          <div className="mt-1 text-sm text-slate-500">{sub}</div>
        </div>

        <div
          className={`rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClasses(
            badge
          )}`}
        >
          {badge}
        </div>
      </div>
    </div>
  )
}