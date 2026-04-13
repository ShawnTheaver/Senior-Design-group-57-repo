'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import {
  GraduationCap,
  BookOpen,
  Award,
  LayoutDashboard,
  User,
  CalendarDays,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  ClipboardList,
  DollarSign,
  Download,
  Link2,
} from 'lucide-react'

type Grade = {
  code: string
  name: string
  credits: number
  grade: string | null
  semester: string
  year: number
}

export default function GradesPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [grades, setGrades] = useState<Grade[]>([])
  const [calculatedGPA, setCalculatedGPA] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.replace('/login')
      return
    }

    async function load() {
      try {
        const email = user?.email

        if (!email) {
          console.error('No email found on user')
          return
        }

        const res = await fetch(`/api/grades?email=${encodeURIComponent(email)}`)
        const data = await res.json()

        if (res.ok) {
          setGrades(Array.isArray(data.grades) ? data.grades : [])
          setCalculatedGPA(data.calculatedGPA ?? null)
        }
      } catch (err) {
        console.error('Error loading grades:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user, router])

  if (!user) return null

  const completedCourses = grades.filter((g) => g.grade && g.grade !== '0')
  const totalCredits = completedCourses.reduce((sum, g) => sum + g.credits, 0)

  function downloadCSV() {
    const header = ['Course Code', 'Course Name', 'Credits', 'Grade', 'Semester', 'Year']
    const rows = grades.map((g) => [
      g.code,
      `"${g.name.replace(/"/g, '""')}"`,
      g.credits,
      g.grade && g.grade !== '0' ? g.grade : 'In Progress',
      g.semester,
      g.year,
    ])
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'grades.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const menuItems = [
    { label: 'Dashboard',        icon: LayoutDashboard, onClick: () => router.push('/dashboard'),       active: false },
    { label: 'Profile',          icon: User,            onClick: () => router.push('/profile'),         active: false },
    { label: 'View My Schedule', icon: CalendarDays,    onClick: () => router.push('/schedule'),        active: false },
    { label: 'Add/Drop/Edit',    icon: ClipboardList,   onClick: () => router.push('/add-drop'),        active: false },
    { label: 'Shopping Cart',    icon: ShoppingCart,    onClick: () => router.push('/enrollment-cart'), active: false },
    { label: 'My Finance',       icon: DollarSign,      onClick: () => router.push('/finance'),         active: false },
    { label: 'Grades',           icon: GraduationCap,   onClick: () => router.push('/grades'),          active: true  },
    { label: 'Quick Links',      icon: Link2,           onClick: () => router.push('/quick-links'),     active: false },
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc]">
      <div className="flex w-full">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          menuItems={menuItems}
          onProfile={() => router.push('/profile')}
          onLogout={() => {
            logout()
            router.push('/login')
          }}
        />

        <main className="flex-1 p-6">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <GraduationCap size={24} />
                </div>

                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">Academic Transcript</h1>
                  <p className="mt-1 text-sm text-slate-500 md:text-base">
                    Review your course history, completed credits, and cumulative GPA.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Transcript</h2>

                <div className="flex gap-2">
                  <button
                    onClick={downloadCSV}
                    className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                  >
                    <Download size={16} />
                    Download My Grades
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="py-3 text-left px-4">Course</th>
                      <th className="py-3 text-left px-4">Credits</th>
                      <th className="py-3 text-left px-4">Grade</th>
                      <th className="py-3 text-left px-4">Semester</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          Loading transcript...
                        </td>
                      </tr>
                    )}

                    {!loading && grades.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          No grades available yet.
                        </td>
                      </tr>
                    )}

                    {!loading &&
                      grades.map((g, i) => {
                        const isCompleted = g.grade && g.grade !== '0'

                        return (
                          <tr key={i} className="border-b border-slate-200 last:border-b-0">
                            <td className="px-4 py-3 text-slate-800">
                              <span className="font-semibold">{g.code}</span> – {g.name}
                            </td>
                            <td className="px-4 py-3 text-slate-700">{g.credits}</td>
                            <td
                              className={`px-4 py-3 font-semibold ${
                                isCompleted ? 'text-emerald-600' : 'text-slate-500'
                              }`}
                            >
                              {isCompleted ? g.grade : 'In Progress'}
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              {g.semester} {g.year}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <SummaryCard
                icon={<BookOpen size={20} />}
                title="Completed Credits"
                value={String(totalCredits)}
                note="Total credit hours earned"
                color="blue"
              />
              <SummaryCard
                icon={<Award size={20} />}
                title="Cumulative GPA"
                value={calculatedGPA != null ? String(calculatedGPA) : '—'}
                note="Overall academic performance"
                color="emerald"
              />
              <SummaryCard
                icon={<GraduationCap size={20} />}
                title="Courses Completed"
                value={String(completedCourses.length)}
                note="Finished and graded courses"
                color="amber"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function SummaryCard({
  icon,
  title,
  value,
  note,
  color,
}: {
  icon: ReactNode
  title: string
  value: string
  note: string
  color: 'blue' | 'emerald' | 'amber'
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-600">{title}</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
          <div className="mt-1 text-sm text-slate-500">{note}</div>
        </div>

        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  menuItems,
  onProfile,
  onLogout,
}: {
  sidebarOpen: boolean
  setSidebarOpen: (value: boolean) => void
  menuItems: {
    label: string
    icon: any
    onClick: () => void
    active: boolean
  }[]
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
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                    item.active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <Icon size={22} />
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onProfile}
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <User size={22} />
          </button>

          <button
            onClick={onLogout}
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-red-50 hover:text-red-500"
          >
            <LogOut size={22} />
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div className="flex w-[230px] flex-col justify-between border-l border-slate-200 px-4 py-4">
          <div>
            <div className="mb-4 px-2 text-sm font-semibold tracking-wide text-slate-400">
              MENU
            </div>

            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-medium transition ${
                      item.active
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-700 hover:bg-slate-100'
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
            <button
              onClick={onProfile}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <User size={20} />
              <span>Profile</span>
            </button>

            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-medium text-red-500 transition hover:bg-red-50"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}