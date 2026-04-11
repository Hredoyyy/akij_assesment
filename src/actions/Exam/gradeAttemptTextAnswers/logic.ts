import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/result";

import { calculateAttemptScore } from "@/actions/Candidate/shared/calculateAttemptScore";

import type { GradeAttemptTextAnswersInput } from "./schema";

type GradeAttemptTextAnswersResult = {
  attemptId: string;
  score: number;
};

export async function gradeAttemptTextAnswersAction(
  payload: GradeAttemptTextAnswersInput,
): Promise<ActionResult<GradeAttemptTextAnswersResult>> {
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
      answers: {
        where: {
          question: {
            type: "TEXT",
          },
        },
        select: {
          id: true,
          question: {
            select: {
              points: true,
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

  const allowedAnswerIds = new Set(attempt.answers.map((answer) => answer.id));
  const maxPointsByAnswerId = new Map(
    attempt.answers.map((answer) => [answer.id, answer.question.points]),
  );

  for (const grade of payload.grades) {
    if (!allowedAnswerIds.has(grade.answerId)) {
      return {
        success: false,
        error: "Invalid grading payload.",
      };
    }

    const maxPoints = maxPointsByAnswerId.get(grade.answerId) ?? 0;

    if (grade.awardedPoints > maxPoints) {
      return {
        success: false,
        error: "Awarded points cannot exceed question points.",
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const grade of payload.grades) {
      await tx.answer.update({
        where: {
          id: grade.answerId,
        },
        data: {
          manualTextScore: grade.awardedPoints,
        },
      });
    }
  });

  const objectiveScore = await calculateAttemptScore(attempt.id);

  const gradedTextAnswers = await prisma.answer.findMany({
    where: {
      attemptId: attempt.id,
      question: {
        type: "TEXT",
      },
    },
    select: {
      manualTextScore: true,
    },
  });

  const totalManualTextScore = gradedTextAnswers.reduce(
    (total, answer) => total + answer.manualTextScore,
    0,
  );

  const nextScore = objectiveScore + totalManualTextScore;

  await prisma.examAttempt.update({
    where: {
      id: attempt.id,
    },
    data: {
      score: nextScore,
      textAnswersGradedAt: new Date(),
    },
  });

  return {
    success: true,
    data: {
      attemptId: attempt.id,
      score: nextScore,
    },
  };
}
