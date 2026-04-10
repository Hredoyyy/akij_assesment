import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/result";

import type { FetchExamDraftInput } from "./schema";

type FetchExamDraftResult = {
  examId: string;
  basicInfo: {
    title: string;
    totalCandidates: number;
    totalSlots: number;
    duration: number;
    negativeMarking: boolean;
  };
  slots: Array<{
    slotNumber: number;
    startTime: string;
    endTime: string;
    questions: Array<{
      title: string;
      type: "CHECKBOX" | "RADIO" | "TEXT";
      points: number;
      options: Array<{ text: string; isCorrect: boolean }>;
    }>;
  }>;
};

export async function fetchExamDraftAction(
  payload: FetchExamDraftInput,
): Promise<ActionResult<FetchExamDraftResult>> {
  const exam = await prisma.exam.findFirst({
    where: {
      id: payload.examId,
      employerId: payload.employerId,
    },
    select: {
      id: true,
      title: true,
      totalCandidates: true,
      totalSlots: true,
      duration: true,
      negativeMarking: true,
      slots: {
        orderBy: {
          slotNumber: "asc",
        },
        select: {
          slotNumber: true,
          startTime: true,
          endTime: true,
          questionSet: {
            select: {
              questions: {
                orderBy: {
                  order: "asc",
                },
                select: {
                  title: true,
                  type: true,
                  points: true,
                  options: {
                    select: {
                      text: true,
                      isCorrect: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!exam) {
    return {
      success: false,
      error: "Exam not found.",
    };
  }

  return {
    success: true,
    data: {
      examId: exam.id,
      basicInfo: {
        title: exam.title,
        totalCandidates: exam.totalCandidates,
        totalSlots: exam.totalSlots,
        duration: exam.duration,
        negativeMarking: exam.negativeMarking,
      },
      slots: exam.slots.map((slot) => ({
        slotNumber: slot.slotNumber,
        startTime: slot.startTime.toISOString().slice(0, 16),
        endTime: slot.endTime.toISOString().slice(0, 16),
        questions: (slot.questionSet?.questions ?? []).map((question) => ({
          title: question.title,
          type: question.type,
          points: question.points,
          options: question.options,
        })),
      })),
    },
  };
}
