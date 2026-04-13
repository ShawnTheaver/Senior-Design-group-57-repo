import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")

  if (!studentId) {
    return NextResponse.json(
      { error: "Missing studentId" },
      { status: 400 }
    )
  }

  try {
    const result = await pool.query<{
      id: number
      code: string
      name: string
      credits: number
      instructor: string
      day: string
      time: string
      location: string
    }>(
      `
      SELECT
        cs.id,
        cc.code,
        cc.name,
        cc.credits,
        COALESCE(p.name, 'TBA') AS instructor,
        cs.day,
        cs.time,
        cs.location
      FROM enrollments e
      JOIN class_sections cs
        ON cs.id = e.section_id
      JOIN catalog_courses cc
        ON cc.id = cs.course_id
      LEFT JOIN professors p
        ON p.id = cs.professor_id
      WHERE e.student_id = $1
      ORDER BY cc.code ASC
      `,
      [studentId]
    )

    return NextResponse.json(result.rows)
  } catch (err) {
    console.error("Schedule API error:", err)
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}