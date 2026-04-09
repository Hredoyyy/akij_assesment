import { NextResponse } from "next/server";

import { saveAnswerAction } from "@/actions/Candidate/saveAnswer/logic";
import { saveAnswerSchema } from "@/actions/Candidate/saveAnswer/schema";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (user.role !== "CANDIDATE" && user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Candidate access only." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = saveAnswerSchema.safeParse({
      candidateId: user.id,
      attemptId: body.attemptId,
      questionId: body.questionId,
      selectedOptionIds: body.selectedOptionIds,
      textAnswer: body.textAnswer,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const result = await saveAnswerAction(parsed.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch {
    return NextResponse.json(
      { error: "Unable to save answer right now." },
      { status: 500 },
    );
  }
}
