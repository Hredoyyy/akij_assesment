import { NextResponse } from "next/server";

import { startAttemptAction } from "@/actions/Candidate/startAttempt/logic";
import { startAttemptSchema } from "@/actions/Candidate/startAttempt/schema";
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
    const parsed = startAttemptSchema.safeParse({
      candidateId: user.id,
      examId: body.examId,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const result = await startAttemptAction(parsed.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to start attempt right now." },
      { status: 500 },
    );
  }
}
