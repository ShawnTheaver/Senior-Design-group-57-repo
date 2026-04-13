// app/data/classes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('email') || ''
  if (!q) return NextResponse.json({ error: 'email is required' }, { status: 400 })

  const client = await pool.connect()
  try {
    const u = await client.query(
      `SELECT id FROM users WHERE email=$1 OR username=$1 OR lower(m_number)=lower($1) LIMIT 1`,
      [q]
    )
    if (!u.rowCount) return NextResponse.json({ sections: [] })
    const uid = u.rows[0].id

    const prog = await client.query(
      `SELECT c.id AS curriculum_id, c.name AS curriculum
         FROM student_progress sp
         JOIN curriculums c ON c.id = sp.curriculum_id
        WHERE sp.student_id=$1
        LIMIT 1`,
      [uid]
    )
    if (!prog.rowCount) return NextResponse.json({ sections: [] })
    const curId = prog.rows[0].curriculum_id

    const rows = await client.query(
      `SELECT cc.code, cc.name AS course_name, cc.credits, cc.required,
              s.day, s.time, s.location, s.capacity, s.enrolled,
              (s.capacity - s.enrolled) AS seats_left,
              p.name AS professor, p.email AS professor_email
         FROM class_sections s
         JOIN catalog_courses cc ON cc.id = s.course_id
         JOIN professors p ON p.id = s.professor_id
        WHERE cc.curriculum_id=$1
        ORDER BY cc.code, s.day, s.time`,
      [curId]
    )

    return NextResponse.json({ curriculum: prog.rows[0].curriculum, sections: rows.rows })
  } catch (e) {
    console.error('classes route error', e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  } finally {
    client.release()
  }
}
