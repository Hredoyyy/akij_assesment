import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/result";

import type { SaveAnswerInput } from "./schema";

type SaveAnswerResult = {
  answerId: string;
};

export async function saveAnswerAction(
  payload: SaveAnswerInput,
): Promise<ActionResult<SaveAnswerResult>> {
  const attempt = await prisma.examAttempt.findFirst({
    where: {
      id: payload.attemptId,
      candidateId: payload.candidateId,
    },
    select: {
      id: true,
      status: true,
      startedAt: true,
      exam: {
        select: {
          duration: true,
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

  if (attempt.status !== "IN_PROGRESS") {
    return {
      success: false,
      error: "Attempt is not active.",
    };
  }

  const durationSeconds = attempt.exam.duration * 60;
  const elapsedSeconds = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);

  if (elapsedSeconds >= durationSeconds) {
    await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "TIMED_OUT",
        submittedAt: new Date(),
      },
    });

    return {
      success: false,
      error: "Attempt timed out.",
    };
  }

  const question = await prisma.question.findUnique({
    where: {
      id: payload.questionId,
    },
    include: {
      options: {
        select: { id: true },
      },
    },
  });

  if (!question) {
    return {
      success: false,
      error: "Question not found.",
    };
  }

  if (question.type === "TEXT") {
    if (!payload.textAnswer?.trim()) {
      return {
        success: false,
        error: "Text answer is required for this question.",
      };
    }
  } else {
    if (payload.selectedOptionIds.length === 0) {
      return {
        success: false,
        error: "Select at least one option.",
      };
    }

    const validOptionIds = new Set(question.options.map((option) => option.id));
    const hasInvalid = payload.selectedOptionIds.some((id) => !validOptionIds.has(id));

    if (hasInvalid) {
      return {
        success: false,
        error: "One or more selected options are invalid.",
      };
    }

    if (question.type === "RADIO" && payload.selectedOptionIds.length > 1) {
      return {
        success: false,
        error: "Only one option can be selected for this question.",
      };
    }
  }

  const answer = await prisma.answer.upsert({
    where: {
      attemptId_questionId: {
        attemptId: payload.attemptId,
        questionId: payload.questionId,
      },
    },
    update: {
      selectedOptionIds: question.type === "TEXT" ? [] : payload.selectedOptionIds,
      textAnswer: question.type === "TEXT" ? payload.textAnswer?.trim() ?? "" : null,
    },
    create: {
      attemptId: payload.attemptId,
      questionId: payload.questionId,
      selectedOptionIds: question.type === "TEXT" ? [] : payload.selectedOptionIds,
      textAnswer: question.type === "TEXT" ? payload.textAnswer?.trim() ?? "" : null,
    },
    select: {
      id: true,
    },
  });

  return {
    success: true,
    data: {
      answerId: answer.id,
    },
  };
}
