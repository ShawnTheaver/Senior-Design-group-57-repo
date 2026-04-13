import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

// Returns distinct instructors the student has had (past + current)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json([], { status: 400 })
    }

    const res = await pool.query<{ name: string; email: string }>(
      `
      SELECT DISTINCT
        p.name,
        LOWER(REPLACE(p.name, ' ', '.')) || '@mail.uc.edu' AS email
      FROM enrollments e
      JOIN class_sections cs ON cs.id = e.section_id
      JOIN professors p      ON p.id  = cs.professor_id
      WHERE e.student_id = $1
        AND p.name IS NOT NULL
      ORDER BY p.name
      `,
      [studentId]
    )

    // Also pull instructors from transcripts (past courses)
    const transcriptRes = await pool.query<{ name: string; email: string }>(
      `
      SELECT DISTINCT
        p.name,
        LOWER(REPLACE(p.name, ' ', '.')) || '@mail.uc.edu' AS email
      FROM student_transcripts st
      JOIN catalog_courses cc  ON cc.id = st.course_id
      JOIN class_sections cs   ON cs.course_id = cc.id
      JOIN professors p        ON p.id = cs.professor_id
      WHERE st.student_id = $1
        AND p.name IS NOT NULL
      ORDER BY p.name
      `,
      [studentId]
    )

    const seen = new Set<string>()
    const instructors: { name: string; email: string }[] = []
    for (const row of [...res.rows, ...transcriptRes.rows]) {
      if (!seen.has(row.name)) {
        seen.add(row.name)
        instructors.push(row)
      }
    }

    return NextResponse.json(instructors)
  } catch (err) {
    console.error('Instructors API error:', err)
    return NextResponse.json([])
  }
}
