import { NextResponse } from "next/server";

import { createExamAction } from "@/actions/Exam/createExam/logic";
import { createExamSchema } from "@/actions/Exam/createExam/schema";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Only employers can create exams." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createExamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid exam payload." }, { status: 400 });
    }

    const result = await createExamAction(parsed.data, user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create exam right now." },
      { status: 500 },
    );
  }
}
