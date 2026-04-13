// app/data/audit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('email') || ''
  if (!q) return NextResponse.json({ error: 'email is required' }, { status: 400 })

  const client = await pool.connect()
  try {
    const u = await client.query(
      `SELECT id, email FROM users WHERE email=$1 OR username=$1 OR lower(m_number)=lower($1) LIMIT 1`,
      [q]
    )
    if (!u.rowCount) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const uid = u.rows[0].id

    const prog = await client.query(
      `SELECT c.id AS curriculum_id, c.name AS curriculum
         FROM student_progress sp
         JOIN curriculums c ON c.id = sp.curriculum_id
        WHERE sp.student_id=$1
        LIMIT 1`,
      [uid]
    )
    if (!prog.rowCount) return NextResponse.json({ error: 'no curriculum' }, { status: 404 })
    const curId = prog.rows[0].curriculum_id

    const catalog = await client.query(
      `SELECT id, code, name, credits, required
         FROM catalog_courses
        WHERE curriculum_id=$1
        ORDER BY code`,
      [curId]
    )

    const taken = await client.query(
      `SELECT cc.id, cc.code, cc.name, cc.credits, t.grade
         FROM student_transcripts t
         JOIN catalog_courses cc ON cc.id = t.course_id
        WHERE t.student_id=$1`,
      [uid]
    )

    const takenSet = new Set(taken.rows.map(r => r.id))
    const required = catalog.rows.filter(r => r.required)
    const missingRequired = required.filter(r => !takenSet.has(r.id))

    const creditsTaken = taken.rows.reduce((s, r) => s + Number(r.credits || 0), 0)
    const creditsRequiredMissing = missingRequired.reduce((s, r) => s + Number(r.credits || 0), 0)

    return NextResponse.json({
      curriculum: prog.rows[0].curriculum,
      taken: taken.rows,
      missing_required: missingRequired,
      credits_taken: creditsTaken,
      credits_missing_required: creditsRequiredMissing,
    })
  } catch (e) {
    console.error('audit route error', e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  } finally {
    client.release()
  }
}
