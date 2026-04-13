// app/data/plan/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

type Section = {
  code:string; course_name:string; credits:number;
  day:string; time:string; location:string; professor:string;
  seats_left:number;
}

function key(d:string,t:string){return `${d}|${t}`}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('email') || ''
  const target = Number(req.nextUrl.searchParams.get('targetCredits') || 15)
  if (!q) return NextResponse.json({ error: 'email is required' }, { status: 400 })

  const client = await pool.connect()
  try {
    const u = await client.query(
      `SELECT id FROM users WHERE email=$1 OR username=$1 OR lower(m_number)=lower($1) LIMIT 1`,
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
        ORDER BY required DESC, code`,
      [curId]
    )
    const taken = await client.query(
      `SELECT course_id FROM student_transcripts WHERE student_id=$1`,
      [uid]
    )
    const takenSet = new Set(taken.rows.map(r=>r.course_id))

    const secs = await client.query(
      `SELECT cc.id as course_id, cc.code, cc.name AS course_name, cc.credits,
              s.day, s.time, s.location, (s.capacity - s.enrolled) AS seats_left,
              p.name AS professor
         FROM class_sections s
         JOIN catalog_courses cc ON cc.id = s.course_id
         JOIN professors p ON p.id = s.professor_id
        WHERE cc.curriculum_id=$1
        ORDER BY cc.required DESC, cc.code, s.day, s.time`,
      [curId]
    )

    const byCourse = new Map<number, Section[]>()
    for (const s of secs.rows as Section[] & any) {
      if (!byCourse.has(s.course_id)) byCourse.set(s.course_id, [])
      byCourse.get(s.course_id)!.push(s)
    }

    const schedule: Section[] = []
    const used = new Set<string>()
    let credits = 0

    function tryAdd(opt: Section) {
      if (opt.seats_left <= 0) return false
      const k = key(opt.day, opt.time)
      if (used.has(k)) return false
      if (credits + Number(opt.credits) > target + 1) return false
      used.add(k); schedule.push(opt); credits += Number(opt.credits); return true
    }

    // required (not taken) first
    for (const c of catalog.rows.filter((x:any)=>x.required)) {
      if (takenSet.has(c.id)) continue
      const choices = (byCourse.get(c.id) || []).sort((a,b)=>b.seats_left - a.seats_left)
      for (const s of choices) { if (tryAdd(s)) break }
      if (credits >= target) break
    }

    // then electives (not taken)
    if (credits < target) {
      for (const c of catalog.rows.filter((x:any)=>!x.required)) {
        if (takenSet.has(c.id)) continue
        const choices = (byCourse.get(c.id) || []).sort((a,b)=>b.seats_left - a.seats_left)
        for (const s of choices) { if (tryAdd(s)) break }
        if (credits >= target) break
      }
    }

    return NextResponse.json({
      curriculum: prog.rows[0].curriculum,
      targetCredits: target,
      plannedCredits: credits,
      sections: schedule,
    })
  } catch (e) {
    console.error('plan route error', e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  } finally {
    client.release()
  }
}
