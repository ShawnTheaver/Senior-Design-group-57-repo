import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get("studentId")

    if (!studentId) {
      return NextResponse.json([])
    }

    // 1️⃣ Get student's curriculum
    const curriculumRes = await pool.query<{
      curriculum_id: number
    }>(
      `
      SELECT curriculum_id
      FROM student_progress
      WHERE student_id = $1
      `,
      [studentId]
    )

    if (curriculumRes.rowCount === 0) {
      return NextResponse.json([])
    }

    const curriculumId = curriculumRes.rows[0].curriculum_id

    // 2️⃣ Get sections from that curriculum
    const sectionsRes = await pool.query(
      `
      SELECT
        cs.id,
        cc.code,
        cc.name,
        cc.credits,
        COALESCE(p.name, 'TBA') AS instructor,
        cs.day,
        cs.time,
        cs.location,
        cs.capacity,
        cs.enrolled
      FROM class_sections cs
      JOIN catalog_courses cc
        ON cc.id = cs.course_id
      LEFT JOIN professors p
        ON p.id = cs.professor_id
      WHERE cc.curriculum_id = $1
      ORDER BY cc.code
      `,
      [curriculumId]
    )

    return NextResponse.json(sectionsRes.rows)

  } catch (err) {
    console.error("Sections API error:", err)
    return NextResponse.json([]) // always return array
  }
}
