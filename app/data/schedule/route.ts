// app/data/schedule/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') || ''
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const client = await pool.connect()
  try {
    const u = await client.query(`SELECT id FROM users WHERE email=$1 LIMIT 1`, [email])
    if (u.rowCount === 0) return NextResponse.json({ events: [] })
    const userId = u.rows[0].id

    const ev = await client.query(
      `SELECT day, time, title
         FROM student_events
        WHERE student_id=$1
        ORDER BY
          CASE day
            WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 ELSE 7
          END, time ASC`,
      [userId]
    )
    return NextResponse.json({ events: ev.rows })
  } catch (e) {
    console.error('schedule route error', e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  } finally {
    client.release()
  }
}
