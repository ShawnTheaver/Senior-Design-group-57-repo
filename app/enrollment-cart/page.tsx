'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart,
  CalendarDays,
  LayoutDashboard,
  User,
  GraduationCap,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Trash2,
  CheckCircle,
  DollarSign,
  Link2,
} from 'lucide-react'

type Section = {
  id: number
  code: string
  name: string
  credits: number
  instructor: string
  day: string
  time: string
  location: string
  capacity: number
  enrolled: number
}

function cartKey(uid: number) { return `catassist-cart-${uid}` }

function loadCart(uid: number): Section[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(cartKey(uid)) || '[]')
  } catch {
    return []
  }
}

export default function EnrollmentCartPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cartClasses, setCartClasses] = useState<Section[]>([])
  const [registering, setRegistering] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const studentId = user?.id
  const uid = user?.id ?? 0

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    setCartClasses(loadCart(user.id))
  }, [user, router])

  function handleDelete(id: number) {
    const next = cartClasses.filter((s) => s.id !== id)
    setCartClasses(next)
    localStorage.setItem(cartKey(uid), JSON.stringify(next))
  }

  async function handleRegister() {
    if (cartClasses.length === 0) return

    setRegistering(true)
    setErrorMsg('')

    const results = await Promise.allSettled(
      cartClasses.map((section) =>
        fetch('/api/enrollment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, sectionId: section.id, action: 'add' }),
        }).then((r) => r.json())
      )
    )

    const errors = results
      .filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.error))
      .map((r) => (r.status === 'fulfilled' ? r.value.error : 'Network error'))

    setRegistering(false)

    if (errors.length > 0 && errors.length === cartClasses.length) {
      setErrorMsg(errors[0] || 'Could not register for classes. Please try again.')
      return
    }

    // Clear cart and show success
    localStorage.setItem(cartKey(uid), JSON.stringify([]))
    setCartClasses([])
    setShowSuccess(true)
  }

  if (!user) return null

  const menuItems = [
    { label: 'Dashboard',        icon: LayoutDashboard, onClick: () => router.push('/dashboard'),       active: false },
    { label: 'Profile',          icon: User,            onClick: () => router.push('/profile'),         active: false },
    { label: 'View My Schedule', icon: CalendarDays,    onClick: () => router.push('/schedule'),        active: false },
    { label: 'Add/Drop/Edit',    icon: ClipboardList,   onClick: () => router.push('/add-drop'),        active: false },
    { label: 'Shopping Cart',    icon: ShoppingCart,    onClick: () => router.push('/enrollment-cart'), active: true  },
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

            {/* Header */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">Enrollment Shopping Cart</h1>
                  <p className="mt-1 text-sm text-slate-500 md:text-base">
                    Review your selected courses and register when you are ready.
                  </p>
                </div>
              </div>
            </div>

            {/* Success Banner */}
            {showSuccess && (
              <div className="flex items-start gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <CheckCircle size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-emerald-800">
                    You have Successfully Enrolled in Your Classes!
                  </h2>
                  <p className="mt-1 text-sm text-emerald-700">
                    Your courses have been registered. You can view them in{' '}
                    <button
                      onClick={() => router.push('/schedule')}
                      className="font-semibold underline"
                    >
                      View My Schedule
                    </button>.
                  </p>
                </div>
              </div>
            )}

            {/* Cart Table */}
            {!showSuccess && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold text-slate-900">Selected Courses</h2>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                    {cartClasses.length} course(s)
                  </span>
                </div>

                {cartClasses.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
                    Your cart is empty. Go to{' '}
                    <button
                      onClick={() => router.push('/add-drop')}
                      className="font-medium text-blue-600 underline"
                    >
                      Add/Drop/Edit Classes
                    </button>{' '}
                    to add courses.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-4 py-3 text-left">Code</th>
                            <th className="px-4 py-3 text-left">Course</th>
                            <th className="px-4 py-3 text-left">Credits</th>
                            <th className="px-4 py-3 text-left">Instructor</th>
                            <th className="px-4 py-3 text-left">Day</th>
                            <th className="px-4 py-3 text-left">Time</th>
                            <th className="px-4 py-3 text-left">Location</th>
                            <th className="px-4 py-3 text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cartClasses.map((course) => (
                            <tr key={course.id} className="border-t border-slate-200 bg-white">
                              <td className="px-4 py-3 font-semibold text-slate-800">{course.code}</td>
                              <td className="px-4 py-3 text-slate-700">{course.name}</td>
                              <td className="px-4 py-3 text-center font-medium text-slate-700">{course.credits}</td>
                              <td className="px-4 py-3 text-slate-700">{course.instructor}</td>
                              <td className="px-4 py-3 text-slate-600">{course.day}</td>
                              <td className="px-4 py-3 text-slate-600">{course.time}</td>
                              <td className="px-4 py-3 text-slate-600">{course.location}</td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => handleDelete(course.id)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-100"
                                >
                                  <Trash2 size={13} />
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {errorMsg && (
                      <p className="mt-3 text-sm font-medium text-red-500">{errorMsg}</p>
                    )}

                    <div className="mt-6">
                      <button
                        onClick={handleRegister}
                        disabled={registering || cartClasses.length === 0}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircle size={20} />
                        {registering ? 'Registering...' : 'Register to Classes'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </main>
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
