import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/result";

import type { FetchAttemptTextAnswersForGradingInput } from "./schema";

type FetchAttemptTextAnswersForGradingResult = {
  attemptId: string;
  candidateName: string;
  currentScore: number;
  textAnswers: Array<{
    answerId: string;
    questionId: string;
    questionTitle: string;
    maxPoints: number;
    textAnswer: string;
    awardedPoints: number;
  }>;
};

export async function fetchAttemptTextAnswersForGradingAction(
  payload: FetchAttemptTextAnswersForGradingInput,
): Promise<ActionResult<FetchAttemptTextAnswersForGradingResult>> {
  const attempt = await prisma.examAttempt.findFirst({
    where: {
      id: payload.attemptId,
      examId: payload.examId,
      exam: {
        employerId: payload.employerId,
      },
      status: {
        in: ["SUBMITTED", "TIMED_OUT", "VIOLATION_TERMINATED"],
      },
    },
    select: {
      id: true,
      score: true,
      candidate: {
        select: {
          name: true,
          email: true,
        },
      },
      answers: {
        where: {
          question: {
            type: "TEXT",
          },
          textAnswer: {
            not: null,
          },
        },
        select: {
          id: true,
          textAnswer: true,
          manualTextScore: true,
          question: {
            select: {
              id: true,
              title: true,
              points: true,
              order: true,
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    return {
      success: false,
      error: "Attempt not found for this exam.",
    };
  }

  return {
    success: true,
    data: {
      attemptId: attempt.id,
      candidateName: attempt.candidate.name ?? attempt.candidate.email,
      currentScore: attempt.score ?? 0,
      textAnswers: [...attempt.answers]
        .sort((a, b) => a.question.order - b.question.order)
        .map((answer) => ({
          answerId: answer.id,
          questionId: answer.question.id,
          questionTitle: answer.question.title,
          maxPoints: answer.question.points,
          textAnswer: answer.textAnswer ?? "",
          awardedPoints: answer.manualTextScore,
        })),
    },
  };
}
