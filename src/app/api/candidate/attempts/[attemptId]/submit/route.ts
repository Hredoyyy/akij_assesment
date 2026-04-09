import { NextResponse } from "next/server";

import { submitAttemptAction } from "@/actions/Candidate/submitAttempt/logic";
import { submitAttemptSchema } from "@/actions/Candidate/submitAttempt/schema";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    attemptId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (user.role !== "CANDIDATE" && user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Candidate access only." }, { status: 403 });
    }

    const { attemptId } = await context.params;
    const body = await request.json();

    const parsed = submitAttemptSchema.safeParse({
      candidateId: user.id,
      attemptId,
      status: body.status,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const result = await submitAttemptAction(parsed.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch {
    return NextResponse.json(
      { error: "Unable to submit attempt right now." },
      { status: 500 },
    );
  }
}
