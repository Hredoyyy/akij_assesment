import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/result";

import type { CreateExamInput } from "./schema";

type CreateExamResult = {
  examId: string;
};

export async function createExamAction(
  payload: CreateExamInput,
  employerId: string,
): Promise<ActionResult<CreateExamResult>> {
  const createdExam = await prisma.$transaction(async (tx) => {
    const exam = await tx.exam.create({
      data: {
        title: payload.title,
        totalCandidates: payload.totalCandidates,
        totalSlots: payload.slots.length,
        duration: payload.duration,
        negativeMarking: payload.negativeMarking,
        employerId,
      },
      select: {
        id: true,
      },
    });

    for (const slot of payload.slots) {
      const createdSlot = await tx.examSlot.create({
        data: {
          examId: exam.id,
          slotNumber: slot.slotNumber,
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime),
        },
        select: {
          id: true,
        },
      });

      const createdQuestionSet = await tx.questionSet.create({
        data: {
          examSlotId: createdSlot.id,
          name: slot.name,
        },
        select: {
          id: true,
        },
      });

      for (const question of slot.questions) {
        const createdQuestion = await tx.question.create({
          data: {
            questionSetId: createdQuestionSet.id,
            title: question.title,
            type: question.type,
            points: question.points,
            order: question.order,
          },
          select: {
            id: true,
          },
        });

        if (question.type === "TEXT") {
          continue;
        }

        if (question.options.length > 0) {
          await tx.option.createMany({
            data: question.options.map((option) => ({
              questionId: createdQuestion.id,
              text: option.text,
              isCorrect: option.isCorrect,
            })),
          });
        }
      }
    }

    return exam;
  });

  return {
    success: true,
    data: {
      examId: createdExam.id,
    },
  };
}
