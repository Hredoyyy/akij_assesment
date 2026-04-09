import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/result";

import type { IncrementViolationInput } from "./schema";

type IncrementViolationResult = {
  violations: number;
  terminated: boolean;
};

export async function incrementViolationAction(
  payload: IncrementViolationInput,
): Promise<ActionResult<IncrementViolationResult>> {
  const attempt = await prisma.examAttempt.findFirst({
    where: {
      id: payload.attemptId,
      candidateId: payload.candidateId,
    },
    select: {
      id: true,
      status: true,
      violations: true,
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
        violations: attempt.violations,
        terminated: attempt.status === "VIOLATION_TERMINATED",
      },
    };
  }

  const nextViolations = attempt.violations + 1;
  const shouldTerminate = nextViolations >= 3;

  const updated = await prisma.examAttempt.update({
    where: {
      id: attempt.id,
    },
    data: {
      violations: nextViolations,
      ...(shouldTerminate
        ? {
            status: "VIOLATION_TERMINATED",
            submittedAt: new Date(),
          }
        : {}),
    },
    select: {
      violations: true,
      status: true,
    },
  });

  return {
    success: true,
    data: {
      violations: updated.violations,
      terminated: updated.status === "VIOLATION_TERMINATED",
    },
  };
}
