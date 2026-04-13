'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  CalendarDays,
  LayoutDashboard,
  User,
  GraduationCap,
  ClipboardList,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  Download,
  Receipt,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Wallet,
  TrendingUp,
  Link2,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// ─── Constants ────────────────────────────────────────────────────────────────
const RATE_PER_CREDIT = 530
const BASE_FEES = [
  { label: 'Equipment Fee',      amount: 250  },
  { label: 'Health Insurance',   amount: 1800 },
  { label: 'Campus Life Fee',    amount: 323  },
  { label: 'General Fee',        amount: 450  },
]
const TOTAL_BASE = BASE_FEES.reduce((s, f) => s + f.amount, 0)

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']

const PAYMENT_DUE = 'August 15, 2025'
const CURRENT_TERM = 'Spring 2025'
const PREV_TERM    = 'Fall 2024'

// ─── Types ────────────────────────────────────────────────────────────────────
type EnrolledCourse = {
  id: number
  code: string
  name: string
  credits: number
  day: string
  time: string
  location: string
}

type GradeCourse = {
  code: string
  name: string
  credits: number
  grade: string | null
  semester: string
  year: number
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FinancePage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [enrolled, setEnrolled]           = useState<EnrolledCourse[]>([])
  const [prevCourses, setPrevCourses]     = useState<GradeCourse[]>([])
  const [showPrevBill, setShowPrevBill]   = useState(false)
  const [loading, setLoading]             = useState(true)

  const studentId = user?.id

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [schedRes, gradesRes] = await Promise.all([
        fetch(`/api/schedule?studentId=${studentId}`),
        fetch(`/api/grades?email=${encodeURIComponent(user.email)}`),
      ])
      const schedData  = await schedRes.json()
      const gradesData = await gradesRes.json()
      setEnrolled(Array.isArray(schedData) ? schedData : [])
      setPrevCourses(Array.isArray(gradesData.grades) ? gradesData.grades : [])
    } catch (e) {
      console.error('Finance load error:', e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    loadData()
  }, [user, router, loadData])

  // ─── Calculations (current semester) ────────────────────────────────────────
  const currentCredits  = enrolled.reduce((s, c) => s + Number(c.credits ?? 0), 0)
  const hasEnrolled     = currentCredits > 0
  const tuition         = currentCredits * RATE_PER_CREDIT
  const currentTotal    = hasEnrolled ? tuition + TOTAL_BASE : 0

  // ─── Calculations (previous semester) ───────────────────────────────────────
  const prevFiltered    = prevCourses.filter(
    (c) => c.semester === 'Fall' && c.year === 2024
  )
  const prevCredits     = prevFiltered.reduce((s, c) => s + Number(c.credits ?? 0), 0)
  const prevTuition     = prevCredits * RATE_PER_CREDIT
  const prevTotal       = prevTuition + TOTAL_BASE

  // ─── Pie data (current) ─────────────────────────────────────────────────────
  const pieData = [
    { name: 'Tuition', value: tuition },
    ...BASE_FEES.map((f) => ({ name: f.label, value: f.amount })),
  ]

  // ─── CSV download ────────────────────────────────────────────────────────────
  function downloadCSV(term: string, courses: { code: string; name: string; credits: number }[], totalCredits: number, totalAmt: number) {
    const tuitionAmt = totalCredits * RATE_PER_CREDIT
    const rows: string[][] = [
      ['CatAssist University — Term Bill'],
      [`Term: ${term}`],
      [`Generated: ${new Date().toLocaleDateString('en-US')}`],
      [],
      ['COURSE CHARGES'],
      ['Course Code', 'Course Name', 'Credits', 'Rate/Credit', 'Amount'],
      ...courses.map((c) => [c.code, c.name, String(c.credits), `$${RATE_PER_CREDIT}`, `$${c.credits * RATE_PER_CREDIT}`]),
      ['', '', `Total Credits: ${totalCredits}`, '', `$${tuitionAmt}`],
      [],
      ['FEES'],
      ['Fee', '', '', '', 'Amount'],
      ...BASE_FEES.map((f) => [f.label, '', '', '', `$${f.amount}`]),
      ['', '', '', 'Total Fees:', `$${TOTAL_BASE}`],
      [],
      ['', '', '', 'TOTAL DUE:', `$${totalAmt}`],
    ]

    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `CatAssist_TermBill_${term.replace(' ', '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!user) return null

  const menuItems = [
    { label: 'Dashboard',         icon: LayoutDashboard, onClick: () => router.push('/dashboard'),        active: false },
    { label: 'Profile',           icon: User,            onClick: () => router.push('/profile'),          active: false },
    { label: 'View My Schedule',  icon: CalendarDays,    onClick: () => router.push('/schedule'),         active: false },
    { label: 'Add/Drop/Edit',     icon: ClipboardList,   onClick: () => router.push('/add-drop'),         active: false },
    { label: 'Shopping Cart',     icon: ShoppingCart,    onClick: () => router.push('/enrollment-cart'),  active: false },
    { label: 'My Finance',        icon: DollarSign,      onClick: () => router.push('/finance'),          active: true  },
    { label: 'Grades',            icon: GraduationCap,   onClick: () => router.push('/grades'),           active: false },
    { label: 'Quick Links',       icon: Link2,           onClick: () => router.push('/quick-links'),      active: false },
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc]">
      <div className="flex w-full">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          menuItems={menuItems}
          onProfile={() => router.push('/profile')}
          onLogout={() => { logout(); router.push('/login') }}
        />

        <main className="flex-1 p-6">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm">
              Loading financial data…
            </div>
          ) : (
            <div className="space-y-6">

              {/* ── Header ──────────────────────────────────────────────────── */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <DollarSign size={26} />
                    </div>
                    <div>
                      <h1 className="text-2xl font-semibold text-slate-900">My Finance</h1>
                      <p className="mt-1 text-sm text-slate-500">
                        {CURRENT_TERM} &mdash; Tuition &amp; Fee Statement
                      </p>
                    </div>
                  </div>

                  {/* Payment status badge */}
                  <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3">
                    <AlertCircle size={18} className="text-amber-500" />
                    <div>
                      <div className="text-sm font-semibold text-amber-800">Payment Due</div>
                      <div className="text-xs text-amber-700">{PAYMENT_DUE}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Summary cards ────────────────────────────────────────────── */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard icon={<BookOpen size={20} />}    color="blue"    label="Enrolled Credits"  value={String(currentCredits)}              sub="This semester" />
                <SummaryCard icon={<TrendingUp size={20} />}  color="indigo"  label="Tuition"           value={hasEnrolled ? fmt(tuition) : '—'}    sub={hasEnrolled ? `${currentCredits} credits` : 'No classes yet'} />
                <SummaryCard icon={<Wallet size={20} />}      color="amber"   label="Total Fees"        value={hasEnrolled ? fmt(TOTAL_BASE) : '—'} sub={hasEnrolled ? '4 base fees' : 'Applies when enrolled'} />
                <SummaryCard icon={<Receipt size={20} />}     color="emerald" label="Total Due"         value={hasEnrolled ? fmt(currentTotal) : '$0.00'} sub={CURRENT_TERM} />
              </div>

              {/* ── Main grid: bill breakdown + pie chart ────────────────────── */}
              <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">

                {/* Bill breakdown */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-5 text-lg font-semibold text-slate-900">{CURRENT_TERM} — Bill Breakdown</h2>

                  {!hasEnrolled ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                      No enrolled courses yet. Fees and tuition will appear once you register for classes.
                    </div>
                  ) : (
                    <>
                      {/* Tuition row */}
                      <div className="mb-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-indigo-900">Tuition</div>
                          <div className="text-xl font-bold text-indigo-900">{fmt(tuition)}</div>
                        </div>
                      </div>

                      {/* Base fees */}
                      <div className="space-y-2">
                        {BASE_FEES.map((fee) => (
                          <div key={fee.label} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3">
                            <span className="text-sm font-medium text-slate-700">{fee.label}</span>
                            <span className="text-sm font-semibold text-slate-800">{fmt(fee.amount)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Divider + total */}
                      <div className="mt-4 border-t border-slate-200 pt-4">
                        <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-5 py-4 text-white">
                          <span className="font-semibold">Total Amount Due</span>
                          <span className="text-2xl font-bold">{fmt(currentTotal)}</span>
                        </div>
                        <p className="mt-2 text-center text-xs text-slate-400">Payment due by {PAYMENT_DUE}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Pie chart */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">Cost Breakdown</h2>
                  {currentCredits === 0 ? (
                    <div className="flex h-[260px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-400">
                      No enrolled courses
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="45%"
                          innerRadius={65}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => fmt(Number(v))} />
                        <Legend iconType="circle" iconSize={10} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* ── Enrolled course credits table ─────────────────────────── */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-slate-900">Enrolled Courses — {CURRENT_TERM}</h2>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                    {currentCredits} Total Credits
                  </span>
                </div>

                {enrolled.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    No enrolled courses found. Tuition will be $0 until you register.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-4 py-3 text-left">Code</th>
                          <th className="px-4 py-3 text-left">Course</th>
                          <th className="px-4 py-3 text-center">Credits</th>
                          <th className="px-4 py-3 text-right">Charge</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrolled.map((c) => (
                          <tr key={c.id} className="border-t border-slate-200 bg-white">
                            <td className="px-4 py-3 font-semibold text-slate-800">{c.code}</td>
                            <td className="px-4 py-3 text-slate-700">{c.name}</td>
                            <td className="px-4 py-3 text-center font-medium text-slate-700">{c.credits}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-800">
                              {fmt(Number(c.credits) * RATE_PER_CREDIT)}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-slate-300 bg-slate-50">
                          <td colSpan={2} className="px-4 py-3 font-semibold text-slate-700">Total</td>
                          <td className="px-4 py-3 text-center font-bold text-slate-900">{currentCredits}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">{fmt(tuition)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Action buttons ────────────────────────────────────────────── */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowPrevBill((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <Receipt size={17} />
                  {showPrevBill ? 'Hide' : 'View'} Previous Semester Bill ({PREV_TERM})
                </button>

                <button
                  onClick={() =>
                    downloadCSV(
                      CURRENT_TERM,
                      enrolled.map((c) => ({ code: c.code, name: c.name, credits: Number(c.credits) })),
                      currentCredits,
                      currentTotal,
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
                >
                  <Download size={17} />
                  Download My Term Bill (CSV)
                </button>
              </div>

              {/* ── Previous semester bill ───────────────────────────────────── */}
              {showPrevBill && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          Previous Semester Bill — {PREV_TERM}
                        </h2>
                        <p className="text-xs text-slate-500">Paid &amp; Archived</p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        downloadCSV(
                          PREV_TERM,
                          prevFiltered.map((c) => ({ code: c.code, name: c.name, credits: Number(c.credits) })),
                          prevCredits,
                          prevTotal,
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      <Download size={14} />
                      Download
                    </button>
                  </div>

                  {prevFiltered.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                      No transcript data found for {PREV_TERM}.
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              <th className="px-4 py-3 text-left">Code</th>
                              <th className="px-4 py-3 text-left">Course</th>
                              <th className="px-4 py-3 text-center">Credits</th>
                              <th className="px-4 py-3 text-left">Grade</th>
                              <th className="px-4 py-3 text-right">Charge</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prevFiltered.map((c, i) => (
                              <tr key={i} className="border-t border-slate-200 bg-white">
                                <td className="px-4 py-3 font-semibold text-slate-800">{c.code}</td>
                                <td className="px-4 py-3 text-slate-700">{c.name}</td>
                                <td className="px-4 py-3 text-center font-medium text-slate-700">{c.credits}</td>
                                <td className="px-4 py-3">
                                  <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                    {c.grade || '—'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-800">
                                  {fmt(Number(c.credits) * RATE_PER_CREDIT)}
                                </td>
                              </tr>
                            ))}
                            <tr className="border-t-2 border-slate-300 bg-slate-50">
                              <td colSpan={2} className="px-4 py-3 font-semibold text-slate-700">Total</td>
                              <td className="px-4 py-3 text-center font-bold text-slate-900">{prevCredits}</td>
                              <td />
                              <td className="px-4 py-3 text-right font-bold text-slate-900">{fmt(prevTuition)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Previous bill total */}
                      <div className="mt-4 space-y-2">
                        {BASE_FEES.map((fee) => (
                          <div key={fee.label} className="flex justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm">
                            <span className="text-slate-600">{fee.label}</span>
                            <span className="font-medium text-slate-700">{fmt(fee.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between rounded-2xl bg-slate-800 px-5 py-3 text-white">
                          <span className="font-semibold">Total Billed ({PREV_TERM})</span>
                          <span className="text-lg font-bold">{fmt(prevTotal)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Financial Aid placeholder ─────────────────────────────── */}
              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <Wallet size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900">Financial Aid &amp; Scholarships</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      No financial aid has been applied to your account for {CURRENT_TERM}.
                      Visit the Financial Aid office or log in to the Aid Portal to check your eligibility.
                    </p>
                  </div>
                  <div className="shrink-0 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600">
                    $0.00 Applied
                  </div>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({
  icon, color, label, value, sub,
}: {
  icon: React.ReactNode
  color: 'blue' | 'indigo' | 'amber' | 'emerald'
  label: string
  value: string
  sub: string
}) {
  const colors = {
    blue:    'bg-blue-50 text-blue-600',
    indigo:  'bg-indigo-50 text-indigo-600',
    amber:   'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
          <div className="mt-0.5 text-xs text-slate-400">{sub}</div>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  sidebarOpen, setSidebarOpen, menuItems, onProfile, onLogout,
}: {
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  menuItems: { label: string; icon: any; onClick: () => void; active: boolean }[]
  onProfile: () => void
  onLogout: () => void
}) {
  return (
    <aside className="flex min-h-[calc(100vh-4rem)] border-r border-slate-200 bg-white">
      <div className="flex w-[74px] flex-col items-center justify-between py-4">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:bg-slate-100"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="mt-2 flex flex-col gap-3">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  title={item.label}
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                    item.active ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <Icon size={22} />
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <button onClick={onProfile} className="flex h-12 w-12 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
            <User size={22} />
          </button>
          <button onClick={onLogout} className="flex h-12 w-12 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-red-50 hover:text-red-500">
            <LogOut size={22} />
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div className="flex w-[230px] flex-col justify-between border-l border-slate-200 px-4 py-4">
          <div>
            <div className="mb-4 px-2 text-sm font-semibold tracking-wide text-slate-400">MENU</div>
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-medium transition ${
                      item.active ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="space-y-2 border-t border-slate-200 pt-4">
            <button onClick={onProfile} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-medium text-slate-700 transition hover:bg-slate-100">
              <User size={20} /><span>Profile</span>
            </button>
            <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-medium text-red-500 transition hover:bg-red-50">
              <LogOut size={20} /><span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
