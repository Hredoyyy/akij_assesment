import { NextResponse } from "next/server";

import { saveAnswersBatchAction } from "@/actions/Candidate/saveAnswersBatch/logic";
import { saveAnswersBatchSchema } from "@/actions/Candidate/saveAnswersBatch/schema";
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
    const parsed = saveAnswersBatchSchema.safeParse({
      candidateId: user.id,
      attemptId: body.attemptId,
      answers: body.answers,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const result = await saveAnswersBatchAction(parsed.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch {
    return NextResponse.json(
      { error: "Unable to save answers right now." },
      { status: 500 },
    );
  }
}
