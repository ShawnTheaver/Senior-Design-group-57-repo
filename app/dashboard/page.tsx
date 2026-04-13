'use client'

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import StatCard from '@/components/StatCard'
import PieChartCard from '@/components/PieChartCard'
import Chatbot, { type PlannerMessage } from '@/components/Chatbot'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
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
  Link2,
  Video,
  MapPin,
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

type SidebarItem = {
  label: string
  icon: React.ComponentType<{ size?: number }>
  onClick: () => void
  active: boolean
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)

  const [studentName, setStudentName] = useState('Student')
  const [program, setProgram] = useState('—')
  const [gpa, setGpa] = useState('—')
  const [completed, setCompleted] = useState(0)
  const [total, setTotal] = useState(0)

  const [upcomingMeeting, setUpcomingMeeting] = useState<{ mode: string; day: string; time: string; category: string } | null>(null)

  const [plannerMessages, setPlannerMessages] = useState<PlannerMessage[]>([])
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('CatAssist Planner Results')
  const [emailBody, setEmailBody] = useState('')

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  useEffect(() => {
    const savedPhoto = localStorage.getItem('catassist-profile-image')
    if (savedPhoto) setProfileImage(savedPhoto)

    if (user?.id) {
      try {
        const raw = localStorage.getItem(`catassist-advisor-meetings-${user.id}`)
        const all = raw ? JSON.parse(raw) : []
        if (all.length > 0) setUpcomingMeeting(all[0])
      } catch {}
    }
  }, [user?.id])

  useEffect(() => {
    const currentUser = user

    if (!currentUser) {
      router.replace('/login')
      return
    }

    async function load() {
      const email = currentUser!.email
      const fallbackName = currentUser!.name || 'Student'

      try {
        const res = await fetch(
          `/data/overview?email=${encodeURIComponent(email)}`
        )
        const data = (await res.json()) as Overview

        setStudentName(data.username || fallbackName)
        setProgram(data.curriculum || '—')
        setGpa(data.gpa || '—')
        setCompleted(Number(data.completed ?? 0))
        setTotal(Number(data.total ?? 0))
      } catch (error) {
        console.error('Failed to load overview:', error)
        setStudentName(fallbackName)
      }
    }

    load()
  }, [user, router])

  const plannerSummary = useMemo(() => {
    const assistantReplies = plannerMessages
      .filter(
        (m) =>
          m.role === 'assistant' &&
          m.text !== "Hi! I'm CatAssist 🐱. Ask about your curriculum, schedule, or scenario."
      )
      .map((m) => m.text.trim())
      .filter(Boolean)

    if (assistantReplies.length === 0) {
      return 'No planner results yet. Ask CatAssist a question first.'
    }

    return assistantReplies.join('\n\n---\n\n')
  }, [plannerMessages])

  function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setProfileImage(result)
      localStorage.setItem('catassist-profile-image', result)
    }
    reader.readAsDataURL(file)
  }

  function openEmailPopup() {
    const defaultBody = [
      `Student: ${studentName}`,
      `Email: ${user?.email || ''}`,
      `Program: ${program}`,
      '',
      'CatAssist Planner Results',
      '========================',
      plannerSummary,
    ].join('\n')

    setEmailTo(user?.email ?? '')
    setEmailSubject('CatAssist Planner Results')
    setEmailBody(defaultBody)
    setEmailOpen(true)
  }

  function sendEmailDraft() {
    const outlookUrl =
      `https://outlook.office.com/mail/deeplink/compose` +
      `?to=${encodeURIComponent(emailTo)}` +
      `&subject=${encodeURIComponent(emailSubject)}` +
      `&body=${encodeURIComponent(emailBody)}`

    const fallbackMailto =
      `mailto:${encodeURIComponent(emailTo)}` +
      `?subject=${encodeURIComponent(emailSubject)}` +
      `&body=${encodeURIComponent(emailBody)}`

    const newTab = window.open(outlookUrl, '_blank', 'noopener,noreferrer')

    if (!newTab) {
      window.open(fallbackMailto, '_blank', 'noopener,noreferrer')
    }
  }

  if (!user) return null

  const menuItems: SidebarItem[] = [
    { label: 'Dashboard',        icon: LayoutDashboard, onClick: () => router.push('/dashboard'),       active: true  },
    { label: 'Profile',          icon: User,            onClick: () => router.push('/profile'),         active: false },
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

        <main className="flex-1 px-4 py-5 lg:px-5">
          <div className="w-full max-w-none">
            <div className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
                    <LayoutDashboard size={24} />
                  </div>

                  <div className="min-w-0">
                    <div className="text-[20px] font-semibold leading-tight text-slate-900 md:text-[22px]">
                      Welcome back, {studentName}
                    </div>
                    <p className="mt-1 max-w-2xl text-sm text-slate-500 md:text-[15px]">
                      Stay on top of your courses, schedule, grades, and degree progress with CatAssist.
                    </p>
                  </div>
                </div>

                <div className="w-full xl:w-auto xl:shrink-0">
                  <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-right">
                      <div className="text-base font-semibold text-slate-900">
                        {studentName}
                      </div>
                      <div className="text-sm text-slate-500">{program}</div>
                    </div>

                    <label className="cursor-pointer">
                      <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-slate-500">Photo</span>
                        )}
                      </div>
                    </label>

                    <button
                      onClick={() => {
                        logout()
                        router.push('/login')
                      }}
                      className="rounded-2xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <StatCard
                title="Degree Progress"
                value={`${percent}%`}
                sub={`${completed} / ${total} courses`}
                badge={percent >= 60 ? 'On track' : 'Catch up'}
              />

              <StatCard
                title="GPA"
                value={gpa}
                sub={program}
                badge="Academics"
              />

              <StatCard
                title="Study Hours"
                value="12.5 h"
                sub="Goal: 15 h"
                badge="Keep going"
              />
            </div>

            {upcomingMeeting && (
              <div
                onClick={() => router.push('/quick-links')}
                className="mt-4 flex cursor-pointer items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3.5 transition hover:bg-blue-100"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${upcomingMeeting.mode === 'online' ? 'bg-blue-200 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {upcomingMeeting.mode === 'online' ? <Video size={17} /> : <MapPin size={17} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    Upcoming Meeting with Advisor
                  </p>
                  <p className="text-xs text-slate-500">
                    {(upcomingMeeting as any).dateLabel ?? (upcomingMeeting as any).day} · {upcomingMeeting.time} · {upcomingMeeting.category}
                    {' '}· <span className="capitalize">{upcomingMeeting.mode === 'online' ? 'Online' : 'In Person'}</span>
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-blue-600">View →</span>
              </div>
            )}

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <PieChartCard progress={percent} />

              <div className="h-[560px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Ai Assistant
                  </h2>

                  <button
                    onClick={openEmailPopup}
                    className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    Email results
                  </button>
                </div>

                <div className="h-[calc(100%-3.5rem)]">
                  <Chatbot onMessagesChange={setPlannerMessages} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-2xl border-slate-200 bg-white text-slate-900">
          <DialogHeader>
            <DialogTitle>Email planner results</DialogTitle>
            <DialogDescription className="text-slate-500">
              Review the draft below, then open it in your email app.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1">
              <label className="text-sm font-medium text-slate-700">To</label>
              <input
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                placeholder="recipient@example.com"
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium text-slate-700">Subject</label>
              <input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium text-slate-700">Message</label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={14}
                className="w-full resize-y rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEmailOpen(false)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={sendEmailDraft}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Open email draft
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
  menuItems: SidebarItem[]
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