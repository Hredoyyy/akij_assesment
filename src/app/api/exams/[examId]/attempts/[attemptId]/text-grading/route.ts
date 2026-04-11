import { NextResponse } from "next/server";

import { fetchAttemptTextAnswersForGradingAction } from "@/actions/Exam/fetchAttemptTextAnswersForGrading/logic";
import { fetchAttemptTextAnswersForGradingSchema } from "@/actions/Exam/fetchAttemptTextAnswersForGrading/schema";
import { gradeAttemptTextAnswersAction } from "@/actions/Exam/gradeAttemptTextAnswers/logic";
import { gradeAttemptTextAnswersSchema } from "@/actions/Exam/gradeAttemptTextAnswers/schema";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    examId: string;
    attemptId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Employer access only." }, { status: 403 });
    }

    const { examId, attemptId } = await context.params;
    const parsed = fetchAttemptTextAnswersForGradingSchema.safeParse({
      employerId: user.id,
      examId,
      attemptId,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const result = await fetchAttemptTextAnswersForGradingAction(parsed.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("[text-grading][GET]", error);
    return NextResponse.json(
      { error: "Unable to load text answers for grading right now." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Employer access only." }, { status: 403 });
    }

    const { examId, attemptId } = await context.params;
    const body = await request.json();

    const parsed = gradeAttemptTextAnswersSchema.safeParse({
      employerId: user.id,
      examId,
      attemptId,
      grades: body.grades,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const result = await gradeAttemptTextAnswersAction(parsed.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("[text-grading][POST]", error);
    return NextResponse.json(
      { error: "Unable to save graded text answers right now." },
      { status: 500 },
    );
  }
}
