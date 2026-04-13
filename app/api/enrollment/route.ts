import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { studentId, sectionId, action } = body

    if (!studentId || !sectionId || !action) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      )
    }

    if (action === "add") {
      // Check if already enrolled
      const existing = await pool.query(
        `
        SELECT 1
        FROM enrollments
        WHERE student_id = $1 AND section_id = $2
        `,
        [studentId, sectionId]
      )

      if (existing.rowCount && existing.rowCount > 0) {
        return NextResponse.json(
          { error: "You are already enrolled in this course." },
          { status: 400 }
        )
      }

      // Check if section is full
      const sectionResult = await pool.query<{
        capacity: number
        enrolled: number
      }>(
        `
        SELECT
          capacity,
          (
            SELECT COUNT(*)
            FROM enrollments
            WHERE section_id = $1
          )::int AS enrolled
        FROM class_sections
        WHERE id = $1
        `,
        [sectionId]
      )

      if (sectionResult.rowCount === 0) {
        return NextResponse.json(
          { error: "Section not found." },
          { status: 404 }
        )
      }

      const section = sectionResult.rows[0]

      if (section.enrolled >= section.capacity) {
        return NextResponse.json(
          { error: "This section is full." },
          { status: 400 }
        )
      }

      await pool.query(
        `
        INSERT INTO enrollments (student_id, section_id)
        VALUES ($1, $2)
        `,
        [studentId, sectionId]
      )

      return NextResponse.json({
        message: "Course added successfully."
      })
    }

    if (action === "drop") {
      const dropResult = await pool.query(
        `
        DELETE FROM enrollments
        WHERE student_id = $1 AND section_id = $2
        `,
        [studentId, sectionId]
      )

      if ((dropResult.rowCount ?? 0) === 0) {
        return NextResponse.json(
          { error: "Enrollment not found." },
          { status: 404 }
        )
      }

      return NextResponse.json({
        message: "Course dropped successfully."
      })
    }

    return NextResponse.json(
      { error: "Invalid action." },
      { status: 400 }
    )
  } catch (err) {
    console.error("Enrollment API error:", err)
    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    )
  }
}