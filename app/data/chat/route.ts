import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'

interface Section {
  course_id: number
  code: string
  course_name: string
  credits: number
  day: string
  time: string
  location: string
  professor: string
  seats_left: number
}

async function ensureSchema(c: any) {
  await c.query(`
    CREATE TABLE IF NOT EXISTS professors (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT
    );
  `)

  await c.query(`
    CREATE TABLE IF NOT EXISTS catalog_courses (
      id BIGSERIAL PRIMARY KEY,
      curriculum_id BIGINT REFERENCES curriculums(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      credits INT NOT NULL DEFAULT 3,
      required BOOLEAN NOT NULL DEFAULT FALSE
    );
  `)

  await c.query(`
    CREATE TABLE IF NOT EXISTS class_sections (
      id BIGSERIAL PRIMARY KEY,
      course_id BIGINT REFERENCES catalog_courses(id) ON DELETE CASCADE,
      professor_id BIGINT REFERENCES professors(id) ON DELETE SET NULL,
      day TEXT NOT NULL,
      time TEXT NOT NULL,
      location TEXT NOT NULL
      -- capacity/enrolled may not exist yet in older seeds
    );
  `)

  // 🔧 Backfill columns if table already existed
  await c.query(`ALTER TABLE class_sections ADD COLUMN IF NOT EXISTS capacity INT NOT NULL DEFAULT 30;`)
  await c.query(`ALTER TABLE class_sections ADD COLUMN IF NOT EXISTS enrolled INT NOT NULL DEFAULT 0;`)

  await c.query(`
    CREATE TABLE IF NOT EXISTS student_transcripts (
      id BIGSERIAL PRIMARY KEY,
      student_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
      course_id BIGINT REFERENCES catalog_courses(id) ON DELETE CASCADE,
      grade TEXT
    );
  `)
}

async function getUserId(emailOrM: string, c: any): Promise<number | null> {
  const r = await c.query(
    `SELECT id FROM users
      WHERE email = $1 OR username = $1 OR lower(m_number) = lower($1)
      LIMIT 1`,
    [emailOrM]
  )
  return r.rowCount ? (r.rows[0].id as number) : null
}

async function getProgram(userId: number, c: any): Promise<{ curriculum_id: number; curriculum: string } | null> {
  const r = await c.query(
    `SELECT c.id AS curriculum_id, c.name AS curriculum
       FROM student_progress sp
       JOIN curriculums c ON c.id = sp.curriculum_id
      WHERE sp.student_id = $1
      LIMIT 1`,
    [userId]
  )
  return r.rowCount ? (r.rows[0] as any) : null
}

async function getCatalog(curriculumId: number, c: any) {
  const r = await c.query(
    `SELECT id, code, name, credits, required
       FROM catalog_courses
      WHERE curriculum_id = $1
      ORDER BY required DESC, code`,
    [curriculumId]
  )
  return r.rows as Array<{ id: number; code: string; name: string; credits: number; required: boolean }>
}

async function getTaken(userId: number, c: any) {
  const r = await c.query(
    `SELECT t.course_id, cc.code, cc.name, cc.credits, t.grade
       FROM student_transcripts t
       JOIN catalog_courses cc ON cc.id = t.course_id
      WHERE t.student_id = $1
      ORDER BY cc.code`,
    [userId]
  )
  return r.rows as Array<{ course_id: number; code: string; name: string; credits: number; grade: string | null }>
}

async function getSections(curriculumId: number, c: any): Promise<Section[]> {
  const r = await c.query(
    `SELECT
        cc.id AS course_id,
        cc.code,
        cc.name AS course_name,
        cc.credits,
        s.day,
        s.time,
        s.location,
        /* seats_left supports old or new schemas */
        (COALESCE(s.capacity, 30) - COALESCE(s.enrolled, 0)) AS seats_left,
        p.name AS professor
       FROM class_sections s
       JOIN catalog_courses cc ON cc.id = s.course_id
       JOIN professors p ON p.id = s.professor_id
      WHERE cc.curriculum_id = $1
      ORDER BY cc.required DESC, cc.code, s.day, s.time`,
    [curriculumId]
  )
  return r.rows as Section[]
}

function listLines(lines: string[], max = 8): string {
  if (!lines.length) return '—'
  if (lines.length <= max) return lines.map(l => `• ${l}`).join('\n')
  return lines.slice(0, max).map(l => `• ${l}`).join('\n') + '\n• …'
}

function buildPlan(
  targetCredits: number,
  catalog: Array<{ id: number; code: string; name: string; credits: number; required: boolean }>,
  takenSet: Set<number>,
  byCourse: Map<number, Section[]>
): { plan: Section[]; credits: number } {
  const usedTimes = new Set<string>()
  const plan: Section[] = []
  let credits = 0
  const key = (d: string, t: string) => `${d}|${t}`

  const tryPick = (s: Section) => {
    if (s.seats_left <= 0) return false
    const k = key(s.day, s.time)
    if (usedTimes.has(k)) return false
    if (credits + Number(s.credits) > targetCredits + 1) return false
    usedTimes.add(k)
    plan.push(s)
    credits += Number(s.credits)
    return true
  }

  for (const course of catalog.filter(c => c.required)) {
    if (takenSet.has(course.id)) continue
    const choices = (byCourse.get(course.id) || []).sort((a, b) => b.seats_left - a.seats_left)
    for (const s of choices) if (tryPick(s)) break
    if (credits >= targetCredits) return { plan, credits }
  }

  for (const course of catalog.filter(c => !c.required)) {
    if (takenSet.has(course.id)) continue
    const choices = (byCourse.get(course.id) || []).sort((a, b) => b.seats_left - a.seats_left)
    for (const s of choices) if (tryPick(s)) break
    if (credits >= targetCredits) break
  }

  return { plan, credits }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email: string = String(body?.email || '').trim()
  const message: string = String(body?.message || '').trim()
  if (!email) return NextResponse.json({ error: 'email missing' }, { status: 400 })
  if (!message) return NextResponse.json({ reply: "Tell me what you'd like to know." })

  const q = message.toLowerCase()
  const client = await pool.connect()
  try {
    await ensureSchema(client)

    const userId = await getUserId(email, client)
    if (!userId) return NextResponse.json({ reply: "I can’t find your account yet." })

    const prog = await getProgram(userId, client)
    if (!prog) return NextResponse.json({ reply: "I don’t see your curriculum mapping yet." })

    const catalog = await getCatalog(prog.curriculum_id, client)
    const taken = await getTaken(userId, client)
    const sections = await getSections(prog.curriculum_id, client)

    const takenSet = new Set(taken.map(t => t.course_id))
    const byCourse: Map<number, Section[]> = new Map()
    for (const s of sections) {
      const cid = catalog.find(c => c.code === s.code)?.id
      if (!cid) continue
      if (!byCourse.has(cid)) byCourse.set(cid, [])
      byCourse.get(cid)!.push(s)
    }

    const required = catalog.filter(c => c.required)
    const missing = required.filter(c => !takenSet.has(c.id))

    if (q.includes('what is my curricul')) {
      const sample = required.slice(0, 6).map(r => `${r.code} (${r.credits} cr)`)
      return NextResponse.json({ reply: `Program: ${prog.curriculum}\nRequired sample:\n${listLines(sample)}` })
    }

    if (q.includes('have i already taken')) {
      const lines = taken.map(t => `${t.code} ${t.name} — ${t.grade ?? '—'} (${t.credits} cr)`)
      return NextResponse.json({ reply: `Completed so far:\n${listLines(lines, 12)}` })
    }

    if (q.includes('missing any required')) {
      const lines = missing.map(m => `${m.code} ${m.name} (${m.credits} cr)`)
      return NextResponse.json({
        reply: missing.length
          ? `Yes — still needed:\n${listLines(lines, 12)}`
          : 'You are not missing any required courses so far.',
      })
    }

    if (q.includes('how many credits do i need for next semester')) {
      const { plan, credits } = buildPlan(15, catalog, takenSet, byCourse)
      const items = plan.map(p => `${p.code} ${p.course_name} (${p.credits} cr)`)
      return NextResponse.json({
        reply: `A typical full-time load is ~15 credits. Proposed plan totals ${credits} credits:\n${listLines(items, 12)}`,
      })
    }

    if (q.includes('what classes should i take next semester')) {
      const { plan } = buildPlan(15, catalog, takenSet, byCourse)
      const items = plan.map(p => `${p.code} ${p.course_name} (${p.credits} cr) — ${p.day} ${p.time} with ${p.professor}`)
      return NextResponse.json({ reply: `Recommended next term:\n${listLines(items, 12)}` })
    }

    if (q.includes('which professors are available')) {
      const open = sections.filter(s => s.seats_left > 0)
      const items = open.map(s => `${s.code} — ${s.professor} (${s.day} ${s.time}) [${s.seats_left} seats]`)
      return NextResponse.json({ reply: `Professors with open seats:\n${listLines(items, 15)}` })
    }

    if (
      q.includes('where are classes') ||
      q.includes('where is this') ||
      q.includes('where are the classes')
    ) {
      const { plan } = buildPlan(15, catalog, takenSet, byCourse)
      if (!plan.length) return NextResponse.json({ reply: 'No planned sections yet; ask me to plan your semester first.' })
      const items = plan.map(p => `${p.code} — ${p.location} (${p.day} ${p.time}, ${p.professor})`)
      return NextResponse.json({ reply: `Locations next term:\n${listLines(items, 12)}` })
    }

    return NextResponse.json({
      reply: `I can help with:
• What is my curriculam?
• What classes should I take next semester?
• How many credits do I need for next semester?
• Which professors are available for the classes am taking next semester?
• Where are classes located that I am taking next semester?
• Am I missing any required classes from the curriculam that I should have taken by now?
• What classes have I already taken so far?`,
    })
  } catch (err: any) {
    console.error('chat route error:', err)
    const msg = (err?.detail || err?.message || String(err)).slice(0, 400)
    return NextResponse.json({ error: msg }, { status: 500 })
  } finally {
    client.release()
  }
}
