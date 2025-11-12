// app/data/overview/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('email')
  if (!q) return NextResponse.json({ error: 'email is required' }, { status: 400 })

  // find student
  const uRes = await pool.query(
    `SELECT id, username, email FROM users
     WHERE email = $1 OR username = $1 OR m_number = $1
     LIMIT 1`,
    [q]
  )
  if (!uRes.rowCount) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  const u = uRes.rows[0] as { id: number; username: string; email: string }

  // progress + curriculum
  const progRes = await pool.query(
    `SELECT c.name AS curriculum, c.description, c.total_courses,
            sp.courses_completed, sp.gpa
       FROM student_progress sp
       JOIN curriculums c ON c.id = sp.curriculum_id
      WHERE sp.student_id = $1
      LIMIT 1`,
    [u.id]
  )

  const prog = progRes.rows[0] || null

  // profile (personal info)
  const profRes = await pool.query(
    `SELECT full_name, phone, year, advisor, hometown, bio
       FROM student_profiles
      WHERE student_id = $1
      LIMIT 1`,
    [u.id]
  )
  const prof = profRes.rows[0] || {}

  const total = prog?.total_courses ?? 0
  const completed = prog?.courses_completed ?? 0
  const percent = total ? Math.round((completed / total) * 100) : 0

  return NextResponse.json({
    username: prof.full_name || u.username,
    email: u.email,
    curriculum: prog?.curriculum || '',
    total,
    completed,
    percent,
    gpa: prog?.gpa?.toString?.() ?? '—',
    description: prog?.description ?? '—',
    profile: {
      phone: prof.phone ?? '—',
      year: prof.year ?? '—',
      advisor: prof.advisor ?? '—',
      hometown: prof.hometown ?? '—',
      bio: prof.bio ?? '—',
    },
  })
}
