import { NextResponse } from "next/server";

import { fetchAttemptRuntimeAction } from "@/actions/Candidate/fetchAttemptRuntime/logic";
import { fetchAttemptRuntimeSchema } from "@/actions/Candidate/fetchAttemptRuntime/schema";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    attemptId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (user.role !== "CANDIDATE" && user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Candidate access only." }, { status: 403 });
    }

    const { attemptId } = await context.params;

    const parsed = fetchAttemptRuntimeSchema.safeParse({
      candidateId: user.id,
      attemptId,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const result = await fetchAttemptRuntimeAction(parsed.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch {
    return NextResponse.json(
      { error: "Unable to load attempt right now." },
      { status: 500 },
    );
  }
}
