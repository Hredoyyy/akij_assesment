import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/result";

import type { SubmitAttemptInput } from "./schema";

type SubmitAttemptResult = {
  attemptId: string;
  status: "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED";
};

export async function submitAttemptAction(
  payload: SubmitAttemptInput,
): Promise<ActionResult<SubmitAttemptResult>> {
  const attempt = await prisma.examAttempt.findFirst({
    where: {
      id: payload.attemptId,
      candidateId: payload.candidateId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!attempt) {
    return {
      success: false,
      error: "Attempt not found.",
    };
  }

  if (attempt.status !== "IN_PROGRESS") {
    return {
      success: true,
      data: {
        attemptId: attempt.id,
        status: attempt.status === "SUBMITTED" ? "SUBMITTED" : payload.status,
      },
    };
  }

  const updated = await prisma.examAttempt.update({
    where: {
      id: attempt.id,
    },
    data: {
      status: payload.status,
      submittedAt: new Date(),
    },
    select: {
      id: true,
      status: true,
    },
  });

  return {
    success: true,
    data: {
      attemptId: updated.id,
      status: updated.status === "IN_PROGRESS" ? payload.status : updated.status,
    },
  };
}
