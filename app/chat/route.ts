import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // optional safety guard
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or "gpt-5-mini" when available
      temperature: 0.6,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `
You are CatAssist 😺, a friendly and helpful AI student assistant.
You remember previous messages in this conversation and maintain context.
You help users plan study sessions, summarize workloads, track deadlines,
and give supportive, realistic academic advice in a casual human tone.
Never repeat the same info unless the user asks for it again.
If context isn't enough, ask polite clarifying questions.
          `,
        },
        ...messages,
      ],
    });

    const reply = completion.choices[0]?.message?.content ?? "Sorry, I lost track of that!";
    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("Chat route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
