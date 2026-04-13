// app/api/chat/route.ts

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { email, message } = await req.json();

    if (!email || typeof email !== "string" || !message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing or invalid email/message" }, { status: 400 });
    }

    // 1) Find user by email
    const userRes = await pool.query(
      `SELECT id, username, email, m_number FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
    const user = userRes.rows[0];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user.id as number;

    // 2) Pull profile
    const profileRes = await pool.query(
      `SELECT full_name, phone, year, advisor, hometown, bio
       FROM student_profiles
       WHERE student_id = $1
       LIMIT 1`,
      [userId]
    );

    // 3) Pull progress + curriculum
    const progressRes = await pool.query(
      `
      SELECT
        sp.courses_completed,
        sp.gpa,
        sp.last_updated,
        c.id AS curriculum_id,
        c.name AS curriculum_name,
        c.description AS curriculum_description,
        c.total_courses
      FROM student_progress sp
      JOIN curriculums c ON c.id = sp.curriculum_id
      WHERE sp.student_id = $1
      LIMIT 1
      `,
      [userId]
    );

    const progress = progressRes.rows[0] ?? null;
    const curriculumId = progress?.curriculum_id ?? null;

    // 4) Student course statuses (legacy dashboard list)
    const studentCoursesRes = await pool.query(
      `
      SELECT course_name, status
      FROM student_courses
      WHERE student_id = $1
      ORDER BY
        CASE status
          WHEN 'In Progress' THEN 1
          WHEN 'Pending' THEN 2
          WHEN 'Completed' THEN 3
          ELSE 4
        END,
        course_name
      `,
      [userId]
    );

    // 5) Student events
    const eventsRes = await pool.query(
      `
      SELECT day, time, title
      FROM student_events
      WHERE student_id = $1
      ORDER BY day, time
      `,
      [userId]
    );

    // 6) Scenario
    const scenarioRes = await pool.query(
      `SELECT scenario FROM student_scenarios WHERE student_id = $1 LIMIT 1`,
      [userId]
    );

    // 7) Catalog courses for the user's curriculum (code/name/credits/required)
    let catalogCourses: any[] = [];
    if (curriculumId) {
      const catalogRes = await pool.query(
        `
        SELECT id, code, name, credits, required
        FROM catalog_courses
        WHERE curriculum_id = $1
        ORDER BY code
        `,
        [curriculumId]
      );
      catalogCourses = catalogRes.rows;
    }

    // 8) Sections + professors for the user's curriculum (this is what enables professor answers)
    let sections: any[] = [];
    if (curriculumId) {
      const sectionsRes = await pool.query(
        `
        SELECT
          cc.code,
          cc.name AS course_name,
          cc.credits,
          cc.required,
          p.name AS professor,
          p.email AS professor_email,
          p.department AS professor_department,
          cs.day,
          cs.time,
          cs.location,
          cs.capacity,
          cs.enrolled,
          (cs.capacity - cs.enrolled) AS seats_left
        FROM class_sections cs
        JOIN catalog_courses cc ON cc.id = cs.course_id
        LEFT JOIN professors p ON p.id = cs.professor_id
        WHERE cc.curriculum_id = $1
        ORDER BY cc.code, cs.day, cs.time
        `,
        [curriculumId]
      );
      sections = sectionsRes.rows;
    }

    // 9) Transcript (grades/semester/year) for context like "missing required"
    const transcriptRes = await pool.query(
      `
      SELECT
        cc.code,
        cc.name AS course_name,
        st.grade,
        st.semester,
        st.year
      FROM student_transcripts st
      JOIN catalog_courses cc ON cc.id = st.course_id
      WHERE st.student_id = $1
      ORDER BY st.year DESC, st.semester DESC
      `,
      [userId]
    );

    // Build a compact, structured context for the model
    const context = {
      user,
      profile: profileRes.rows[0] ?? null,
      progress,
      student_courses: studentCoursesRes.rows,
      events: eventsRes.rows,
      scenario: scenarioRes.rows[0]?.scenario ?? null,
      catalog_courses: catalogCourses,
      class_sections: sections,
      transcript: transcriptRes.rows,
    };

    // Helpful policy: prefer sections with seats left; don't hallucinate unknown data.
    const systemPrompt = `
You are CatAssist 🐱, a college course scheduling assistant.

Use ONLY the structured data provided in "StudentContext" to answer.
- If asked about professors, use StudentContext.class_sections.
- If asked about locations/times, use StudentContext.class_sections.
- If recommending sections, prefer ones with seats_left > 0.
- If asked about missing required courses, compare:
  - required catalog_courses
  - transcript + student_courses statuses
  and explain what appears missing.
If the data does not contain the answer, say you don't have enough information.

Keep responses concise, practical, and student-friendly.

StudentContext:
${JSON.stringify(context)}
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0]?.message?.content ?? "No response.";

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("❌ /api/chat error:", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
