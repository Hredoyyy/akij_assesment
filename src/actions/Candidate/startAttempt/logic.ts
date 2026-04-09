import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/result";

import type { StartAttemptInput } from "./schema";

type StartAttemptResult = {
  attemptId: string;
};

export async function startAttemptAction(
  payload: StartAttemptInput,
): Promise<ActionResult<StartAttemptResult>> {
  const existingAttempt = await prisma.examAttempt.findUnique({
    where: {
      candidateId_examId: {
        candidateId: payload.candidateId,
        examId: payload.examId,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (existingAttempt) {
    if (existingAttempt.status !== "IN_PROGRESS") {
      return {
        success: false,
        error: "This exam attempt has already been completed.",
      };
    }

    return {
      success: true,
      data: {
        attemptId: existingAttempt.id,
      },
    };
  }

  const now = new Date();

  const activeSlot = await prisma.examSlot.findFirst({
    where: {
      examId: payload.examId,
      startTime: { lte: now },
      endTime: { gte: now },
    },
    select: {
      id: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  if (!activeSlot) {
    return {
      success: false,
      error: "No active slot is currently available for this exam.",
    };
  }

  const attempt = await prisma.examAttempt.create({
    data: {
      candidateId: payload.candidateId,
      examId: payload.examId,
      examSlotId: activeSlot.id,
    },
    select: {
      id: true,
    },
  });

  return {
    success: true,
    data: {
      attemptId: attempt.id,
    },
  };
}
