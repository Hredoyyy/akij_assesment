import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/result";

import type { FetchAvailableExamsInput } from "./schema";

type AvailableExam = {
  examId: string;
  title: string;
  duration: number;
  questionCount: number;
  negativeMarking: boolean;
  slotNumber: number;
  slotStartTime: Date;
  slotEndTime: Date;
  attemptStatus: "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED" | null;
};

export async function fetchAvailableExamsAction(
  payload: FetchAvailableExamsInput,
): Promise<ActionResult<AvailableExam[]>> {
  const now = new Date();

  const slots = await prisma.examSlot.findMany({
    where: {
      endTime: { gte: now },
    },
    include: {
      exam: {
        select: {
          id: true,
          title: true,
          duration: true,
          negativeMarking: true,
          attempts: {
            where: {
              candidateId: payload.candidateId,
            },
            select: {
              status: true,
            },
            take: 1,
          },
        },
      },
      questionSet: {
        select: {
          questions: {
            select: {
              id: true,
            },
          },
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  return {
    success: true,
    data: slots.map((slot) => ({
      examId: slot.exam.id,
      title: slot.exam.title,
      duration: slot.exam.duration,
      questionCount: slot.questionSet?.questions.length ?? 0,
      negativeMarking: slot.exam.negativeMarking,
      slotNumber: slot.slotNumber,
      slotStartTime: slot.startTime,
      slotEndTime: slot.endTime,
      attemptStatus: slot.exam.attempts[0]?.status ?? null,
    })),
  };
}
