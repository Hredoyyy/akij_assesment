import { NextResponse } from "next/server";

import { fetchAvailableExamsAction } from "@/actions/Candidate/fetchAvailableExams/logic";
import { fetchAvailableExamsSchema } from "@/actions/Candidate/fetchAvailableExams/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (user.role !== "CANDIDATE" && user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Candidate access only." }, { status: 403 });
    }

    const payload = fetchAvailableExamsSchema.parse({ candidateId: user.id });
    const result = await fetchAvailableExamsAction(payload);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch {
    return NextResponse.json(
      { error: "Unable to load available exams right now." },
      { status: 500 },
    );
  }
}
