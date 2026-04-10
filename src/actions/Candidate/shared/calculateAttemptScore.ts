import { prisma } from "@/lib/prisma";

export async function calculateAttemptScore(attemptId: string): Promise<number> {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: {
      exam: {
        select: {
          negativeMarking: true,
        },
      },
      answers: {
        select: {
          selectedOptionIds: true,
          question: {
            select: {
              type: true,
              points: true,
              options: {
                where: {
                  isCorrect: true,
                },
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    return 0;
  }

  let score = 0;
  const wrongAnswerPenaltyRatio = 0.25;

  for (const answer of attempt.answers) {
    if (answer.question.type === "TEXT") {
      continue;
    }

    const selectedOptionIds = Array.from(new Set(answer.selectedOptionIds)).sort();
    const correctOptionIds = answer.question.options.map((option) => option.id).sort();

    if (selectedOptionIds.length === 0) {
      continue;
    }

    const isCorrectSelection =
      selectedOptionIds.length === correctOptionIds.length &&
      selectedOptionIds.every((id, index) => id === correctOptionIds[index]);

    if (isCorrectSelection) {
      score += answer.question.points;
      continue;
    }

    if (attempt.exam.negativeMarking) {
      score -= answer.question.points * wrongAnswerPenaltyRatio;
    }

  }

  return score;
}
