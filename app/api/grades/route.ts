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
      code: string
      name: string
      credits: number
      grade: string | null
      semester: string
      year: number
    }>(
      `
      SELECT
        cc.code,
        cc.name,
        cc.credits,
        st.grade,
        st.semester,
        st.year
      FROM student_transcripts st
      JOIN catalog_courses cc
        ON cc.id = st.course_id
      WHERE st.student_id = $1
      ORDER BY st.year DESC, st.semester DESC
      `,
      [studentId]
    )

    const gradeMap: Record<string, number> = {
      A: 4.0,
      "A-": 3.7,
      "B+": 3.3,
      B: 3.0,
      "B-": 2.7,
      "C+": 2.3,
      C: 2.0,
      "C-": 1.7,
      D: 1.0,
      F: 0.0
    }

    let totalCredits = 0
    let totalPoints = 0

    for (const row of result.rows) {
      if (row.grade && row.grade !== "0") {
        const normalized = row.grade.toUpperCase()
        const points = gradeMap[normalized]

        if (points !== undefined) {
          totalCredits += row.credits
          totalPoints += points * row.credits
        }
      }
    }

    const calculatedGPA =
      totalCredits > 0
        ? Number((totalPoints / totalCredits).toFixed(2))
        : null

    return NextResponse.json({
      grades: result.rows,
      calculatedGPA
    })

  } catch (err) {
    console.error("Grades API error:", err)
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}
