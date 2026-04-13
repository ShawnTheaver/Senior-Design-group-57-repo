'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  BookOpen,
  LayoutDashboard,
  User,
  GraduationCap,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  ClipboardList,
  DollarSign,
  Link2,
  Mail,
} from 'lucide-react'

type Enrolled = {
  id: number
  code: string
  name: string
  credits: number
  instructor: string
  instructor_email?: string
  day: string
  time: string
  location: string
}

function buildInstructorEmail(name: string): string {
  if (!name || name === 'TBA') return ''
  return name.toLowerCase().replace(/\s+/g, '.') + '@mail.uc.edu'
}

export default function SchedulePage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [enrolled, setEnrolled] = useState<Enrolled[]>([])
  const [selectedDropSection, setSelectedDropSection] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const studentId = user?.id

  async function fetchEnrolled() {
    try {
      const res = await fetch(`/api/schedule?studentId=${studentId}`)
      const data = await res.json()
      setEnrolled(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching enrolled schedule:', error)
      setEnrolled([])
    }
  }

  useEffect(() => {
    if (!user) {
      router.replace('/login')
      return
    }
    fetchEnrolled()
  }, [user, router])

  async function handleDrop() {
    if (!selectedDropSection) {
      setMessage('Please select a course from your current schedule to drop.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, sectionId: selectedDropSection, action: 'drop' }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Could not drop course.')
      } else {
        setMessage(data.message || 'Course dropped successfully.')
        setSelectedDropSection(null)
        await fetchEnrolled()
      }
    } catch (error) {
      console.error('Drop error:', error)
      setMessage('Server error while dropping course.')
    } finally {
      setLoading(false)
    }
  }

  function handleEmailProfessor(course: Enrolled) {
    const email = course.instructor_email || buildInstructorEmail(course.instructor)
    if (!email) return
    const subject = encodeURIComponent(`Question about ${course.code} – ${course.name}`)
    const body = encodeURIComponent(
      `Dear Professor ${course.instructor},\n\nI am a student enrolled in ${course.code} – ${course.name}.\n\nI am writing to...\n\nThank you,\n${user?.name}\n${user?.email}`
    )
    window.open(`mailto:${email}?subject=${subject}&body=${body}`)
  }

  if (!user) return null

  const menuItems = [
    { label: 'Dashboard',        icon: LayoutDashboard, onClick: () => router.push('/dashboard'),       active: false },
    { label: 'Profile',          icon: User,            onClick: () => router.push('/profile'),         active: false },
    { label: 'View My Schedule', icon: CalendarDays,    onClick: () => router.push('/schedule'),        active: true  },
    { label: 'Add/Drop/Edit',    icon: ClipboardList,   onClick: () => router.push('/add-drop'),        active: false },
    { label: 'Shopping Cart',    icon: ShoppingCart,    onClick: () => router.push('/enrollment-cart'), active: false },
    { label: 'My Finance',       icon: DollarSign,      onClick: () => router.push('/finance'),         active: false },
    { label: 'Grades',           icon: GraduationCap,   onClick: () => router.push('/grades'),          active: false },
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
          onLogout={() => { logout(); router.push('/login') }}
        />

        <main className="flex-1 p-6">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <CalendarDays size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">View My Schedule</h1>
                  <p className="mt-1 text-sm text-slate-500 md:text-base">
                    Your current semester enrolled courses.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-900">Current Semester Schedule</h2>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                  Total Courses: {enrolled.length}
                </span>
              </div>

              {enrolled.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
                  You are not enrolled in any classes yet. Use{' '}
                  <button
                    onClick={() => router.push('/add-drop')}
                    className="font-medium text-blue-600 underline"
                  >
                    Add/Drop/Edit Classes
                  </button>{' '}
                  to register.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-left">Select</th>
                        <th className="px-4 py-3 text-left">Code</th>
                        <th className="px-4 py-3 text-left">Course</th>
                        <th className="px-4 py-3 text-left">Credits</th>
                        <th className="px-4 py-3 text-left">Instructor</th>
                        <th className="px-4 py-3 text-left">Day</th>
                        <th className="px-4 py-3 text-left">Time</th>
                        <th className="px-4 py-3 text-left">Location</th>
                        <th className="px-4 py-3 text-left">Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolled.map((course, i) => (
                        <tr
                          key={course.id ?? i}
                          className={`border-t border-slate-200 ${
                            selectedDropSection === course.id ? 'bg-blue-50' : 'bg-white'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="radio"
                              name="drop-course"
                              checked={selectedDropSection === course.id}
                              onChange={() => setSelectedDropSection(course.id)}
                            />
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{course.code}</td>
                          <td className="px-4 py-3 text-slate-700">{course.name}</td>
                          <td className="px-4 py-3 text-center font-medium text-slate-700">{course.credits}</td>
                          <td className="px-4 py-3 text-slate-700">{course.instructor}</td>
                          <td className="px-4 py-3 text-slate-600">{course.day}</td>
                          <td className="px-4 py-3 text-slate-600">{course.time}</td>
                          <td className="px-4 py-3 text-slate-600">{course.location}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleEmailProfessor(course)}
                              disabled={!course.instructor || course.instructor === 'TBA'}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Mail size={13} />
                              Email Professor
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {enrolled.length > 0 && (
                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={handleDrop}
                    disabled={loading || !selectedDropSection}
                    className="rounded-2xl bg-red-500 px-5 py-2.5 font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Drop Selected Course'}
                  </button>
                  {message && <span className="text-sm text-slate-600">{message}</span>}
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <MiniCard
                icon={<BookOpen size={20} />}
                title="Enrolled Courses"
                value={String(enrolled.length)}
                note="Current semester"
                color="blue"
              />
              <MiniCard
                icon={<CalendarDays size={20} />}
                title="Next Step"
                value="Plan ahead"
                note="Add classes for next semester"
                color="emerald"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function MiniCard({
  icon, title, value, note, color,
}: {
  icon: ReactNode; title: string; value: string; note: string; color: 'blue' | 'emerald' | 'amber'
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
  sidebarOpen, setSidebarOpen, menuItems, onProfile, onLogout,
}: {
  sidebarOpen: boolean
  setSidebarOpen: (value: boolean) => void
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
