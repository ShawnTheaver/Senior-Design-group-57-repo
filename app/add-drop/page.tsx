'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import {
  ClipboardList,
  CalendarDays,
  Clock3,
  MapPin,
  LayoutDashboard,
  User,
  GraduationCap,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  Trash2,
  Plus,
  DollarSign,
  Search,
  Link2,
  Mail,
  UserPlus,
  Clock,
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

function storageAdded(uid: number)     { return `catassist-added-classes-${uid}` }
function storageCart(uid: number)      { return `catassist-cart-${uid}` }
function storageRequested(uid: number) { return `catassist-requested-classes-${uid}` }

function loadFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function buildInstructorEmail(name: string): string {
  if (!name || name === 'TBA') return ''
  return name.toLowerCase().replace(/\s+/g, '.') + '@mail.uc.edu'
}

export default function AddDropPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sections, setSections] = useState<Section[]>([])
  const [addedClasses, setAddedClasses] = useState<Section[]>([])
  const [requestedClasses, setRequestedClasses] = useState<Section[]>([])
  const [cartIds, setCartIds] = useState<number[]>([])
  const [successMsg, setSuccessMsg] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [openOnly, setOpenOnly] = useState(false)

  const uid = user?.id ?? 0

  useEffect(() => {
    if (!user) { router.replace('/login'); return }

    fetch(`/api/sections?studentId=${user.id}`)
      .then((r) => r.json())
      .then((data) => setSections(Array.isArray(data) ? data : []))
      .catch(() => setSections([]))

    setAddedClasses(loadFromStorage<Section>(storageAdded(user.id)))
    setRequestedClasses(loadFromStorage<Section>(storageRequested(user.id)))
    setCartIds(loadFromStorage<Section>(storageCart(user.id)).map((s) => s.id))
  }, [user, router])

  function handleAdd(section: Section) {
    const alreadyAdded = addedClasses.some((s) => s.id === section.id)
    const inCart = cartIds.includes(section.id)
    if (alreadyAdded || inCart) return

    const next = [...addedClasses, section]
    setAddedClasses(next)
    localStorage.setItem(storageAdded(uid), JSON.stringify(next))
  }

  function handleRequestJoin(section: Section) {
    const alreadyRequested = requestedClasses.some((s) => s.id === section.id)
    if (alreadyRequested) return

    const next = [...requestedClasses, section]
    setRequestedClasses(next)
    localStorage.setItem(storageRequested(uid), JSON.stringify(next))
    setSuccessMsg(`Join request sent for ${section.code} – ${section.name}.`)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  function handleRemoveAdded(id: number) {
    const next = addedClasses.filter((s) => s.id !== id)
    setAddedClasses(next)
    localStorage.setItem(storageAdded(uid), JSON.stringify(next))
  }

  function handleRemoveRequested(id: number) {
    const next = requestedClasses.filter((s) => s.id !== id)
    setRequestedClasses(next)
    localStorage.setItem(storageRequested(uid), JSON.stringify(next))
  }

  function handleAddToCart() {
    if (addedClasses.length === 0) return

    const existingCart = loadFromStorage<Section>(storageCart(uid))
    const existingIds = new Set(existingCart.map((s) => s.id))
    const newItems = addedClasses.filter((s) => !existingIds.has(s.id))
    const updatedCart = [...existingCart, ...newItems]

    localStorage.setItem(storageCart(uid), JSON.stringify(updatedCart))
    localStorage.setItem(storageAdded(uid), JSON.stringify([]))
    setAddedClasses([])
    setCartIds(updatedCart.map((s) => s.id))
    setSuccessMsg(`${newItems.length} course(s) added to your Enrollment Shopping Cart.`)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  function handleEmailInstructor(section: Section) {
    const email = buildInstructorEmail(section.instructor)
    if (!email) return
    const subject = encodeURIComponent(`Question about ${section.code} – ${section.name}`)
    const body = encodeURIComponent(
      `Dear Professor ${section.instructor},\n\nI am interested in enrolling in ${section.code} – ${section.name}.\n\nI am writing to...\n\nThank you,\n${user?.name}\n${user?.email}`
    )
    window.open(`mailto:${email}?subject=${subject}&body=${body}`)
  }

  const q = searchQuery.trim().toLowerCase()
  const filteredSections = sections.filter((s) => {
    const matchesQuery = q === '' || s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    const matchesOpen  = !openOnly || s.enrolled < s.capacity
    return matchesQuery && matchesOpen
  })

  if (!user) return null

  const menuItems = [
    { label: 'Dashboard',        icon: LayoutDashboard, onClick: () => router.push('/dashboard'),       active: false },
    { label: 'Profile',          icon: User,            onClick: () => router.push('/profile'),         active: false },
    { label: 'View My Schedule', icon: CalendarDays,    onClick: () => router.push('/schedule'),        active: false },
    { label: 'Add/Drop/Edit',    icon: ClipboardList,   onClick: () => router.push('/add-drop'),        active: true  },
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

            {/* Header */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">Add/Drop/Edit Classes</h1>
                  <p className="mt-1 text-sm text-slate-500 md:text-base">
                    Browse available courses for next semester, add them to your list, and submit to your Enrollment Shopping Cart.
                  </p>
                </div>
              </div>
            </div>

            {/* Add Classes for Next Semester */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold text-slate-900">Add Classes for Next Semester</h2>

              {/* Search Bar */}
              <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by course name or code…"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex cursor-pointer items-center gap-2.5 select-none">
                      <div
                        onClick={() => setOpenOnly((v) => !v)}
                        className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${openOnly ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${openOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                      <span className={`text-sm font-medium ${openOnly ? 'text-emerald-700' : 'text-slate-600'}`}>
                        Open classes only
                      </span>
                    </label>
                    <span className="shrink-0 rounded-lg bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">
                      {filteredSections.length} of {sections.length} shown
                    </span>
                  </div>
                </div>
              </div>

              {sections.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
                  No available sections for your program.
                </div>
              ) : filteredSections.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                  <Search size={28} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-medium">No courses match your search.</p>
                  <p className="mt-1 text-sm">Try a different name, code, or clear the filters.</p>
                </div>
              ) : (
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
                        <th className="px-4 py-3 text-left">Seats</th>
                        <th className="px-4 py-3 text-left">Action</th>
                        <th className="px-4 py-3 text-left">Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSections.map((section) => {
                        const isFull = section.enrolled >= section.capacity
                        const isAdded = addedClasses.some((s) => s.id === section.id)
                        const isInCart = cartIds.includes(section.id)
                        const isRequested = requestedClasses.some((s) => s.id === section.id)

                        return (
                          <tr
                            key={section.id}
                            className={`border-t border-slate-200 transition ${isAdded || isInCart ? 'bg-slate-50 opacity-60' : 'bg-white'}`}
                          >
                            <td className="px-4 py-3 font-semibold text-slate-800">{section.code}</td>
                            <td className="px-4 py-3 text-slate-700">{section.name}</td>
                            <td className="px-4 py-3 text-center font-medium text-slate-700">{section.credits}</td>
                            <td className="px-4 py-3 text-slate-700">{section.instructor}</td>
                            <td className="px-4 py-3 text-slate-600">
                              <span className="inline-flex items-center gap-1"><CalendarDays size={14} />{section.day}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              <span className="inline-flex items-center gap-1"><Clock3 size={14} />{section.time}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              <span className="inline-flex items-center gap-1"><MapPin size={14} />{section.location}</span>
                            </td>
                            <td className={`px-4 py-3 font-medium ${isFull ? 'text-red-500' : 'text-slate-500'}`}>
                              {section.enrolled}/{section.capacity}{isFull ? ' (Full)' : ''}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1.5">
                                {/* Add button (only if not full) */}
                                {!isFull && (
                                  <button
                                    onClick={() => handleAdd(section)}
                                    disabled={isAdded || isInCart}
                                    className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                      isInCart
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : isAdded
                                        ? 'bg-emerald-100 text-emerald-600 cursor-not-allowed'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-500'
                                    }`}
                                  >
                                    <Plus size={13} />
                                    {isInCart ? 'In Cart' : isAdded ? 'Added' : 'Add'}
                                  </button>
                                )}
                                {/* Request to Join (only if full) */}
                                {isFull && (
                                  <button
                                    onClick={() => handleRequestJoin(section)}
                                    disabled={isRequested}
                                    className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                      isRequested
                                        ? 'bg-amber-100 text-amber-600 cursor-not-allowed'
                                        : 'bg-amber-500 text-white hover:bg-amber-600'
                                    }`}
                                  >
                                    <UserPlus size={13} />
                                    {isRequested ? 'Requested' : 'Request to Join'}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleEmailInstructor(section)}
                                disabled={!section.instructor || section.instructor === 'TBA'}
                                className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Mail size={13} />
                                Email Instructor
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Added Classes */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-900">Added Classes</h2>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
                  {addedClasses.length} course(s)
                </span>
              </div>

              {addedClasses.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
                  No classes added yet. Click <strong>Add</strong> on a course above.
                </div>
              ) : (
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
                      {addedClasses.map((course) => (
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
                              onClick={() => handleRemoveAdded(course.id)}
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
              )}

              <div className="mt-5 flex items-center gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={addedClasses.length === 0}
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingCart size={18} />
                  Add to Enrollment Shopping Cart
                </button>
                {successMsg && (
                  <span className="text-sm font-medium text-emerald-600">{successMsg}</span>
                )}
              </div>
            </div>

            {/* Requested to Join Classes */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Requested to Join</h2>
                    <p className="text-xs text-slate-500">Pending professor approval — will move to Added Classes when approved</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                  {requestedClasses.length} pending
                </span>
              </div>

              {requestedClasses.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
                  No join requests pending. Click <strong>Request to Join</strong> on a full class above.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-amber-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-left">Code</th>
                        <th className="px-4 py-3 text-left">Course</th>
                        <th className="px-4 py-3 text-left">Credits</th>
                        <th className="px-4 py-3 text-left">Instructor</th>
                        <th className="px-4 py-3 text-left">Day</th>
                        <th className="px-4 py-3 text-left">Time</th>
                        <th className="px-4 py-3 text-left">Location</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requestedClasses.map((course) => (
                        <tr key={course.id} className="border-t border-slate-200 bg-white">
                          <td className="px-4 py-3 font-semibold text-slate-800">{course.code}</td>
                          <td className="px-4 py-3 text-slate-700">{course.name}</td>
                          <td className="px-4 py-3 text-center font-medium text-slate-700">{course.credits}</td>
                          <td className="px-4 py-3 text-slate-700">{course.instructor}</td>
                          <td className="px-4 py-3 text-slate-600">{course.day}</td>
                          <td className="px-4 py-3 text-slate-600">{course.time}</td>
                          <td className="px-4 py-3 text-slate-600">{course.location}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              <Clock size={11} />
                              Awaiting Approval
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleRemoveRequested(course.id)}
                              className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-100"
                            >
                              <Trash2 size={13} />
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

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
