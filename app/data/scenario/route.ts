// app/data/scenario/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') || ''
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const client = await pool.connect()
  try {
    const u = await client.query(`SELECT id FROM users WHERE email=$1 LIMIT 1`, [email])
    if (u.rowCount === 0) return NextResponse.json({ scenario: null })
    const userId = u.rows[0].id

    const s = await client.query(
      `SELECT scenario FROM student_scenarios WHERE student_id=$1 LIMIT 1`,
      [userId]
    )
    return NextResponse.json({ scenario: s.rowCount ? s.rows[0].scenario : null })
  } catch (e) {
    console.error('scenario route error', e)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  } finally {
    client.release()
  }
}
