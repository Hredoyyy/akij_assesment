import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/result";

import type { FetchAttemptRuntimeInput } from "./schema";

type RuntimeQuestion = {
  id: string;
  title: string;
  type: "CHECKBOX" | "RADIO" | "TEXT";
  points: number;
  order: number;
  options: Array<{
    id: string;
    text: string;
  }>;
};

type RuntimeAnswer = {
  questionId: string;
  selectedOptionIds: string[];
  textAnswer: string | null;
};

type AttemptRuntime = {
  attemptId: string;
  examId: string;
  examTitle: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED";
  startedAt: Date;
  durationMinutes: number;
  remainingSeconds: number;
  violations: number;
  questions: RuntimeQuestion[];
  answers: RuntimeAnswer[];
};

export async function fetchAttemptRuntimeAction(
  payload: FetchAttemptRuntimeInput,
): Promise<ActionResult<AttemptRuntime>> {
  const attempt = await prisma.examAttempt.findFirst({
    where: {
      id: payload.attemptId,
      candidateId: payload.candidateId,
    },
    include: {
      exam: {
        select: {
          id: true,
          title: true,
          duration: true,
        },
      },
      examSlot: {
        include: {
          questionSet: {
            include: {
              questions: {
                orderBy: {
                  order: "asc",
                },
                include: {
                  options: {
                    select: {
                      id: true,
                      text: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      answers: {
        select: {
          questionId: true,
          selectedOptionIds: true,
          textAnswer: true,
        },
      },
    },
  });

  if (!attempt) {
    return {
      success: false,
      error: "Attempt not found.",
    };
  }

  const durationSeconds = attempt.exam.duration * 60;
  const elapsedSeconds = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);
  const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

  let resolvedStatus = attempt.status;

  if (attempt.status === "IN_PROGRESS" && remainingSeconds === 0) {
    const timedOutAttempt = await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "TIMED_OUT",
        submittedAt: new Date(),
      },
      select: {
        status: true,
      },
    });

    resolvedStatus = timedOutAttempt.status;
  }

  return {
    success: true,
    data: {
      attemptId: attempt.id,
      examId: attempt.exam.id,
      examTitle: attempt.exam.title,
      status: resolvedStatus,
      startedAt: attempt.startedAt,
      durationMinutes: attempt.exam.duration,
      remainingSeconds,
      violations: attempt.violations,
      questions:
        attempt.examSlot.questionSet?.questions.map((question) => ({
          id: question.id,
          title: question.title,
          type: question.type,
          points: question.points,
          order: question.order,
          options: question.options,
        })) ?? [],
      answers: attempt.answers,
    },
  };
}
