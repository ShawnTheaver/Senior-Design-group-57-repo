import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { pool } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      )
    }

    const result = await pool.query<{
      id: number
      email: string
      username: string | null
      password_hash: string
    }>(
      `
      SELECT id, email, username, password_hash
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email]
    )

    if (!result.rowCount || result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    const user = result.rows[0]

    const passwordOk = await bcrypt.compare(password, user.password_hash)

    if (!passwordOk) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.username || user.email,
      },
    })
  } catch (error) {
    console.error('POST /api/login error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Server error.',
      },
      { status: 500 }
    )
  }
}