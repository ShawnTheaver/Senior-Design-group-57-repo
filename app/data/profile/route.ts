// app/data/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') || ''
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const client = await pool.connect()
  try {
    const u = await client.query(`SELECT id, username, email FROM users WHERE email=$1 LIMIT 1`, [email])
    if (u.rowCount === 0) return NextResponse.json({ user: null, profile: null, curriculum: null })
    const user = u.rows[0]

    const prof = await client.query(
      `SELECT full_name, phone, year, advisor, hometown, bio
         FROM student_profiles WHERE student_id=$1 LIMIT 1`,
      [user.id]
    )

    const prog = await client.query(
      `SELECT sp.courses_completed, sp.gpa, c.id AS curriculum_id, c.name, c.description, c.total_courses
         FROM student_progress sp
         JOIN curriculums c ON c.id = sp.curriculum_id
        WHERE sp.student_id=$1 LIMIT 1`,
      [user.id]
    )

    let curriculum = null
    if (prog.rowCount) {
      const p = prog.rows[0]
      const total = Number(p.total_courses ?? 0)
      const done = Number(p.courses_completed ?? 0)
      const percent = total ? Math.round((done / total) * 100) : 0
      curriculum = {
        id: p.curriculum_id,
        name: p.name,
        description: p.description,
        total_courses: total,
        courses_completed: done,
        gpa: p.gpa ? Number(p.gpa) : null,
        percent,
      }
    }

    return NextResponse.json({
      user,
      profile: prof.rowCount ? prof.rows[0] : null,
      curriculum,
    })
  } catch (e) {
    console.error('profile route error', e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  } finally {
    client.release()
  }
}
