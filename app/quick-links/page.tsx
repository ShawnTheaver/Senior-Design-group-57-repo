'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import {
  Link2,
  LayoutDashboard,
  User,
  CalendarDays,
  GraduationCap,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  ClipboardList,
  DollarSign,
  UserCheck,
  Video,
  MapPin,
  Mail,
  Send,
  CheckCircle,
  BookOpen,
  Trash2,
  Clock,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type Advisor = {
  firstName: string
  lastName: string
  office: string
  room: string
  email: string
}

type Instructor = {
  name: string
  email: string
}

type MeetingMode = 'online' | 'inperson' | null

type Meeting = {
  id: string
  mode: 'online' | 'inperson'
  date: string      // ISO date: "2026-04-14"
  dateLabel: string // "Mon, April 14th"
  time: string
  category: string
  desc: string
}

// ── Static data ───────────────────────────────────────────────────────────────

const MEETING_CATEGORIES = [
  'Academic Concern',
  'Drop Classes',
  'Graduation Planning',
  'Major / Minor Change',
  'Transfer Credit Review',
  'Academic Probation',
  'Course Substitution',
  'General Advising',
]

/** Times available per weekday name */
const TIMES_BY_DAY: Record<string, string[]> = {
  Monday:    ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM'],
  Tuesday:   ['9:30 AM', '11:00 AM', '1:00 PM',  '2:30 PM', '4:00 PM'],
  Wednesday: ['10:00 AM', '11:30 AM', '1:00 PM', '3:00 PM'],
  Thursday:  ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '3:30 PM'],
  Friday:    ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM'],
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function ordinal(n: number): string {
  if (n >= 11 && n <= 13) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}

/** Generate the next `weeksAhead` weeks of Mon–Fri dates starting from tomorrow */
function getUpcomingDates(weeksAhead = 4): { iso: string; label: string; shortLabel: string; dayName: string }[] {
  const results: { iso: string; label: string; shortLabel: string; dayName: string }[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 1; i <= weeksAhead * 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dow = d.getDay()
    if (dow === 0 || dow === 6) continue // skip weekends

    const dayName = DAY_NAMES[dow]
    const month = MONTH_NAMES[d.getMonth()]
    const day = d.getDate()
    const year = d.getFullYear()
    const iso = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    results.push({
      iso,
      label: `${dayName}, ${month} ${ordinal(day)}`,       // "Monday, April 14th"
      shortLabel: `${dayName.slice(0, 3)} ${ordinal(day)}`, // "Mon Apr 14th" for compact display
      dayName,
    })
  }
  return results
}

// ── localStorage helpers ──────────────────────────────────────────────────────

function meetingsKey(uid: number) { return `catassist-advisor-meetings-${uid}` }

function loadMeetings(uid: number): Meeting[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(meetingsKey(uid)) || '[]') } catch { return [] }
}

function saveMeetings(uid: number, meetings: Meeting[]) {
  localStorage.setItem(meetingsKey(uid), JSON.stringify(meetings))
}

// ── Page component ────────────────────────────────────────────────────────────

export default function QuickLinksPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [advisor, setAdvisor] = useState<Advisor | null>(null)
  const [advisorLoading, setAdvisorLoading] = useState(true)
  const [meetings, setMeetings] = useState<Meeting[]>([])

  // Modal
  const [meetingOpen, setMeetingOpen] = useState(false)
  const [meetingMode, setMeetingMode] = useState<MeetingMode>(null)
  const [selectedDate, setSelectedDate] = useState<{ iso: string; label: string; dayName: string } | null>(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [meetingCategory, setMeetingCategory] = useState('')
  const [meetingDesc, setMeetingDesc] = useState('')
  const [meetingSuccess, setMeetingSuccess] = useState(false)

  // Rec letter
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [selectedInstructor, setSelectedInstructor] = useState('')
  const [recDesc, setRecDesc] = useState('')
  const [recSent, setRecSent] = useState(false)

  const uid = user?.id ?? 0
  const upcomingDates = getUpcomingDates(4)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }

    fetch(`/api/advisor?studentId=${user.id}`)
      .then((r) => r.json())
      .then((data) => setAdvisor(data.advisor ?? null))
      .catch(() => setAdvisor(null))
      .finally(() => setAdvisorLoading(false))

    fetch(`/api/instructors?studentId=${user.id}`)
      .then((r) => r.json())
      .then((data) => setInstructors(Array.isArray(data) ? data : []))
      .catch(() => setInstructors([]))

    setMeetings(loadMeetings(user.id))
  }, [user, router])

  if (!user) return null

  const menuItems = [
    { label: 'Dashboard',        icon: LayoutDashboard, onClick: () => router.push('/dashboard'),       active: false },
    { label: 'Profile',          icon: User,            onClick: () => router.push('/profile'),         active: false },
    { label: 'View My Schedule', icon: CalendarDays,    onClick: () => router.push('/schedule'),        active: false },
    { label: 'Add/Drop/Edit',    icon: ClipboardList,   onClick: () => router.push('/add-drop'),        active: false },
    { label: 'Shopping Cart',    icon: ShoppingCart,    onClick: () => router.push('/enrollment-cart'), active: false },
    { label: 'My Finance',       icon: DollarSign,      onClick: () => router.push('/finance'),         active: false },
    { label: 'Grades',           icon: GraduationCap,   onClick: () => router.push('/grades'),          active: false },
    { label: 'Quick Links',      icon: Link2,           onClick: () => router.push('/quick-links'),     active: true  },
  ]

  function openMeetingModal() {
    setMeetingMode(null)
    setSelectedDate(null)
    setSelectedTime('')
    setMeetingCategory('')
    setMeetingDesc('')
    setMeetingSuccess(false)
    setMeetingOpen(true)
  }

  // Times for selected date — any already booked for that exact date are marked
  const availableTimesForDate = selectedDate
    ? TIMES_BY_DAY[selectedDate.dayName] ?? []
    : []
  const bookedTimesForDate = new Set(
    meetings.filter((m) => m.date === selectedDate?.iso).map((m) => m.time)
  )

  function handleSchedule() {
    if (!meetingMode || !selectedDate || !selectedTime || !meetingCategory) return
    const newMeeting: Meeting = {
      id: `${Date.now()}`,
      mode: meetingMode,
      date: selectedDate.iso,
      dateLabel: selectedDate.label,
      time: selectedTime,
      category: meetingCategory,
      desc: meetingDesc,
    }
    const updated = [...meetings, newMeeting]
    setMeetings(updated)
    saveMeetings(uid, updated)
    setMeetingSuccess(true)
  }

  function handleCancelMeeting(id: string) {
    const updated = meetings.filter((m) => m.id !== id)
    setMeetings(updated)
    saveMeetings(uid, updated)
  }

  const canSchedule = !!meetingMode && !!selectedDate && !!selectedTime && !!meetingCategory

  function handleSendRec() {
    const inst = instructors.find((i) => i.name === selectedInstructor)
    if (!inst) return
    const subject = encodeURIComponent('Recommendation Letter Request')
    const body = encodeURIComponent(
      `Dear Professor ${inst.name},\n\nI hope this message finds you well. My name is ${user!.name}, and I was a student in your class at the University of Cincinnati.\n\nI am writing to respectfully request a letter of recommendation.\n\n${recDesc}\n\nThank you for your time and consideration.\n\nBest regards,\n${user!.name}\n${user!.email}`
    )
    window.open(`mailto:${inst.email}?subject=${subject}&body=${body}`)
    setRecSent(true)
    setTimeout(() => setRecSent(false), 4000)
  }

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
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <Link2 size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">Quick Links</h1>
                  <p className="mt-1 text-sm text-slate-500 md:text-base">
                    Access your academic advisor, schedule meetings, and request recommendation letters.
                  </p>
                </div>
              </div>
            </div>

            {/* My Advisor */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UserCheck size={20} />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">My Academic Advisor</h2>
              </div>

              {advisorLoading ? (
                <p className="text-slate-500">Loading advisor information…</p>
              ) : advisor ? (
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="text-lg font-bold text-slate-900">
                      {advisor.firstName} {advisor.lastName}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin size={14} className="shrink-0 text-slate-400" />
                      University of Cincinnati — {advisor.office}, Room {advisor.room}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail size={14} className="shrink-0 text-slate-400" />
                      <a href={`mailto:${advisor.email}`} className="text-blue-600 underline hover:text-blue-800">
                        {advisor.email}
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={openMeetingModal}
                    className="flex items-center gap-2 self-start rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <CalendarDays size={16} />
                    Schedule Meeting
                  </button>
                </div>
              ) : (
                <p className="text-slate-500">No advisor information available.</p>
              )}
            </div>

            {/* Upcoming Meetings */}
            {meetings.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Clock size={20} />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">Upcoming Meetings with Advisor</h2>
                </div>

                <div className="space-y-3">
                  {meetings.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          m.mode === 'online' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {m.mode === 'online' ? <Video size={17} /> : <MapPin size={17} />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {m.dateLabel} · {m.time}
                          </div>
                          <div className="text-xs text-slate-500">
                            {m.category}
                            {m.mode === 'inperson' && advisor && (
                              <span className="ml-1.5 text-slate-400">
                                · {advisor.office}, Rm {advisor.room}
                              </span>
                            )}
                          </div>
                          {m.desc && (
                            <div className="mt-0.5 text-xs text-slate-400 line-clamp-1">{m.desc}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          m.mode === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {m.mode === 'online' ? 'Online' : 'In Person'}
                        </span>
                        <button
                          onClick={() => handleCancelMeeting(m.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                          title="Cancel meeting"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule Meeting Modal */}
            {meetingOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h3 className="text-lg font-semibold text-slate-900">Schedule a Meeting</h3>
                    <button
                      onClick={() => setMeetingOpen(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
                    {meetingSuccess ? (
                      <div className="flex flex-col items-center gap-4 py-8 text-center">
                        <CheckCircle size={52} className="text-emerald-500" />
                        <p className="text-xl font-semibold text-slate-900">
                          You have successfully scheduled your meeting!
                        </p>
                        <button
                          onClick={() => setMeetingOpen(false)}
                          className="mt-1 rounded-2xl bg-emerald-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-5">

                        {/* Meeting type */}
                        <div>
                          <p className="mb-3 text-sm font-semibold text-slate-700">Meeting Type</p>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => setMeetingMode('online')}
                              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition ${
                                meetingMode === 'online'
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                            >
                              <Video size={26} className="text-blue-600" />
                              <span className="text-sm font-semibold text-slate-800">Online</span>
                              <span className="text-xs text-slate-500">Video / Zoom</span>
                            </button>
                            <button
                              onClick={() => setMeetingMode('inperson')}
                              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition ${
                                meetingMode === 'inperson'
                                  ? 'border-emerald-500 bg-emerald-50'
                                  : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'
                              }`}
                            >
                              <MapPin size={26} className="text-emerald-600" />
                              <span className="text-sm font-semibold text-slate-800">In Person</span>
                              <span className="text-xs text-slate-500">{advisor?.office}, Rm {advisor?.room}</span>
                            </button>
                          </div>
                        </div>

                        {/* Date picker — exact upcoming dates */}
                        <div>
                          <p className="mb-2 text-sm font-semibold text-slate-700">
                            Select a Date
                            <span className="ml-1.5 font-normal text-slate-400 text-xs">(next 4 weeks, Mon–Fri)</span>
                          </p>
                          <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-xl border border-slate-200 p-2">
                            {upcomingDates.map((d) => {
                              const fullyBooked =
                                (TIMES_BY_DAY[d.dayName] ?? []).every((t) =>
                                  meetings.some((m) => m.date === d.iso && m.time === t)
                                )
                              return (
                                <button
                                  key={d.iso}
                                  onClick={() => { if (!fullyBooked) { setSelectedDate(d); setSelectedTime('') } }}
                                  disabled={fullyBooked}
                                  className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                                    fullyBooked
                                      ? 'cursor-not-allowed text-slate-300 line-through'
                                      : selectedDate?.iso === d.iso
                                      ? 'bg-blue-600 text-white'
                                      : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  {d.label}
                                  {fullyBooked && (
                                    <span className="ml-2 text-xs font-normal text-slate-300">Fully booked</span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Time slot picker */}
                        {selectedDate && (
                          <div>
                            <p className="mb-2 text-sm font-semibold text-slate-700">
                              Available Times — {selectedDate.label}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {availableTimesForDate.map((t) => {
                                const isBooked = bookedTimesForDate.has(t)
                                return (
                                  <button
                                    key={t}
                                    onClick={() => { if (!isBooked) setSelectedTime(t) }}
                                    disabled={isBooked}
                                    title={isBooked ? 'Already booked' : undefined}
                                    className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                                      isBooked
                                        ? 'cursor-not-allowed bg-slate-100 text-slate-300 line-through'
                                        : selectedTime === t
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                  >
                                    {t}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Category */}
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">Category</label>
                          <select
                            value={meetingCategory}
                            onChange={(e) => setMeetingCategory(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="">Select a topic…</option>
                            {MEETING_CATEGORIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">
                            Description{' '}
                            <span className="font-normal text-slate-400">(optional)</span>
                          </label>
                          <textarea
                            value={meetingDesc}
                            onChange={(e) => setMeetingDesc(e.target.value)}
                            rows={3}
                            placeholder="Briefly describe what you'd like to discuss…"
                            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <button
                          onClick={handleSchedule}
                          disabled={!canSchedule}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <CalendarDays size={16} />
                          Schedule Meeting
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Request Recommendation Letter */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <BookOpen size={20} />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Request Recommendation Letter</h2>
              </div>

              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Select Instructor *</label>
                  {instructors.length === 0 ? (
                    <p className="text-sm text-slate-500">No instructors found. Your course history will appear here.</p>
                  ) : (
                    <select
                      value={selectedInstructor}
                      onChange={(e) => setSelectedInstructor(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    >
                      <option value="">Choose a professor…</option>
                      {instructors.map((inst) => (
                        <option key={inst.email} value={inst.name}>
                          {inst.name} — {inst.email}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Description *</label>
                  <textarea
                    value={recDesc}
                    onChange={(e) => setRecDesc(e.target.value)}
                    rows={4}
                    placeholder="Describe the purpose of the letter, the program or position you're applying to, and any relevant details the professor should know…"
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSendRec}
                    disabled={!selectedInstructor || !recDesc.trim()}
                    className="flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={15} />
                    Send Email via Outlook
                  </button>
                  {recSent && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                      <CheckCircle size={15} />
                      Email opened in Outlook!
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400">
                  Clicking "Send Email" will open Outlook (or your default mail client) with the email pre-filled.
                </p>
              </div>
            </div>

          </div>
        </main>
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
