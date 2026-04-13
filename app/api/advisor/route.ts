import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

// Advisors pool by major keyword (case-insensitive match against curriculum name)
const ADVISORS: Record<string, { firstName: string; lastName: string; office: string; room: string; email: string }[]> = {
  'information technology': [
    { firstName: 'James',   lastName: 'Holloway',  office: 'Rhodes Hall',          room: '412',  email: 'james.holloway@uc.edu' },
    { firstName: 'Sarah',   lastName: 'Mitchell',  office: 'Engineering Building',  room: '205',  email: 'sarah.mitchell@uc.edu' },
    { firstName: 'Kevin',   lastName: 'Park',      office: 'Baldwin Hall',          room: '318',  email: 'kevin.park@uc.edu' },
  ],
  'cybersecurity': [
    { firstName: 'Angela',  lastName: 'Torres',    office: 'Lindner Hall',          room: '310',  email: 'angela.torres@uc.edu' },
    { firstName: 'Marcus',  lastName: 'Chen',      office: 'Rhodes Hall',           room: '507',  email: 'marcus.chen@uc.edu' },
    { firstName: 'Diana',   lastName: 'Reeves',    office: 'Swift Hall',            room: '102',  email: 'diana.reeves@uc.edu' },
  ],
  'accounting': [
    { firstName: 'Patricia',lastName: 'Nguyen',    office: 'Lindner Hall',          room: '215',  email: 'patricia.nguyen@uc.edu' },
    { firstName: 'Robert',  lastName: 'Walsh',     office: 'Lindner Hall',          room: '330',  email: 'robert.walsh@uc.edu' },
    { firstName: 'Karen',   lastName: 'Bryant',    office: 'Carl H. Lindner Hall',  room: '408',  email: 'karen.bryant@uc.edu' },
  ],
  'finance': [
    { firstName: 'Thomas',  lastName: 'Ellison',   office: 'Lindner Hall',          room: '512',  email: 'thomas.ellison@uc.edu' },
    { firstName: 'Monica',  lastName: 'Sanders',   office: 'Lindner Hall',          room: '119',  email: 'monica.sanders@uc.edu' },
    { firstName: 'Brian',   lastName: 'Okafor',    office: 'Carl H. Lindner Hall',  room: '227',  email: 'brian.okafor@uc.edu' },
  ],
}

function pickAdvisor(curriculumName: string, studentId: number) {
  const key = Object.keys(ADVISORS).find((k) =>
    curriculumName.toLowerCase().includes(k)
  )
  const pool = key ? ADVISORS[key] : ADVISORS['information technology']
  // Deterministically pick advisor based on student ID so each student gets a consistent advisor
  return pool[studentId % pool.length]
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })
    }

    // Get curriculum name for the student
    const res = await pool.query<{ name: string }>(
      `
      SELECT c.name
      FROM student_progress sp
      JOIN curriculums c ON c.id = sp.curriculum_id
      WHERE sp.student_id = $1
      LIMIT 1
      `,
      [studentId]
    )

    const curriculumName = res.rows[0]?.name ?? 'Information Technology'
    const advisor = pickAdvisor(curriculumName, Number(studentId))

    return NextResponse.json({ advisor, curriculumName })
  } catch (err) {
    console.error('Advisor API error:', err)
    // Fallback advisor if DB is unavailable
    return NextResponse.json({
      advisor: { firstName: 'James', lastName: 'Holloway', office: 'Rhodes Hall', room: '412', email: 'james.holloway@uc.edu' },
      curriculumName: 'Information Technology',
    })
  }
}
