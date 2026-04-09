import { NextResponse } from "next/server";

import { incrementViolationAction } from "@/actions/Candidate/incrementViolation/logic";
import { incrementViolationSchema } from "@/actions/Candidate/incrementViolation/schema";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    attemptId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (user.role !== "CANDIDATE" && user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Candidate access only." }, { status: 403 });
    }

    const { attemptId } = await context.params;
    const parsed = incrementViolationSchema.safeParse({
      candidateId: user.id,
      attemptId,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const result = await incrementViolationAction(parsed.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch {
    return NextResponse.json(
      { error: "Unable to record violation right now." },
      { status: 500 },
    );
  }
}
