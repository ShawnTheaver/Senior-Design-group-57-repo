'use client'

import {
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import {
  User,
  GraduationCap,
  Phone,
  MapPin,
  BookOpen,
  LayoutDashboard,
  CalendarDays,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  ClipboardList,
  DollarSign,
  Link2,
} from 'lucide-react'

type Overview = {
  username: string
  email: string
  curriculum: string
  total: number
  completed: number
  percent: number
  gpa: string
  description: string
  profile: {
    phone: string
    year: string
    advisor: string
    hometown: string
    bio: string
  }
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)

  const [ov, setOv] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    const savedPhoto = localStorage.getItem('catassist-profile-image')
    if (savedPhoto) setPhoto(savedPhoto)
  }, [])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      router.replace('/login')
      return
    }

    const q = (user.email || user.name || '').trim()

    if (!q) {
      setErr('No identity available. Please sign in again.')
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        setLoading(true)
        setErr('')
        const res = await fetch(`/data/overview?email=${encodeURIComponent(q)}`)
        if (!res.ok) throw new Error(`Overview fetch failed (${res.status})`)
        const data = (await res.json()) as Overview
        setOv(data)
      } catch (e: any) {
        setErr(e?.message || 'Failed to load profile')
        setOv(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [user, router])

  function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setPhoto(result)
      localStorage.setItem('catassist-profile-image', result)
    }
    reader.readAsDataURL(file)
  }

  const menuItems = [
    { label: 'Dashboard',        icon: LayoutDashboard, onClick: () => router.push('/dashboard'),       active: false },
    { label: 'Profile',          icon: User,            onClick: () => router.push('/profile'),         active: true  },
    { label: 'View My Schedule', icon: CalendarDays,    onClick: () => router.push('/schedule'),        active: false },
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
          onLogout={() => {
            logout()
            router.push('/login')
          }}
        />

        <main className="flex-1 p-6">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
              Loading profile...
            </div>
          ) : err ? (
            <div className="rounded-3xl border border-red-200 bg-white p-6 text-sm text-red-500 shadow-sm">
              {err}
            </div>
          ) : !ov ? null : (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <User size={24} />
                    </div>

                    <div>
                      <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
                      <p className="mt-1 text-sm text-slate-500 md:text-base">
                        View your personal details and academic information in one place.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-right">
                      <div className="text-base font-semibold text-slate-900">{ov.username}</div>
                      <div className="text-sm text-slate-500">{ov.curriculum}</div>
                    </div>

                    <label className="cursor-pointer">
                      <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
                        {photo ? (
                          <img
                            src={photo}
                            alt="Student"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-slate-500">Photo</span>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                      <Phone size={20} />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoCard label="Name" value={ov.username} />
                    <InfoCard label="Email" value={ov.email} />
                    <InfoCard label="Phone" value={ov.profile.phone} />
                    <InfoCard label="Year" value={ov.profile.year} />
                    <InfoCard label="Advisor" value={ov.profile.advisor} />
                    <InfoCard label="Hometown" value={ov.profile.hometown} />
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-1 text-sm font-medium text-slate-500">Bio</div>
                    <div className="text-sm text-slate-700">{ov.profile.bio || '—'}</div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <GraduationCap size={20} />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">Academic Overview</h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoCard label="Program" value={ov.curriculum || '—'} />
                    <InfoCard label="GPA" value={ov.gpa} />
                    <InfoCard label="Completed Courses" value={`${ov.completed} / ${ov.total}`} />
                    <InfoCard label="Progress" value={`${ov.percent}%`} />
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-1 text-sm font-medium text-slate-500">About Program</div>
                    <div className="text-sm text-slate-700">{ov.description || '—'}</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard
                  icon={<BookOpen size={20} />}
                  title="Academic Progress"
                  value={`${ov.percent}%`}
                  note="Steady progress toward your degree"
                  color="blue"
                />
                <SummaryCard
                  icon={<GraduationCap size={20} />}
                  title="Current GPA"
                  value={ov.gpa}
                  note="Keep building strong academic results"
                  color="emerald"
                />
                <SummaryCard
                  icon={<MapPin size={20} />}
                  title="Hometown"
                  value={ov.profile.hometown || '—'}
                  note="Your profile information"
                  color="amber"
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-800">{value || '—'}</div>
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