import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/result";

import type { FetchEmployerExamsInput } from "./schema";

type EmployerExamSummary = {
  id: string;
  title: string;
  totalCandidates: number;
  totalSlots: number;
  totalQuestionSets: number;
  totalQuestions: number;
  duration: number;
  negativeMarking: boolean;
  createdAt: Date;
  updatedAt: Date;
  candidates: Array<{
    attemptId: string;
    candidateName: string;
    score: number | null;
    violations: number;
    requiresTextGrading: boolean;
    isTextGraded: boolean;
    status: "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED";
  }>;
};

const isFinalAttemptStatus = (
  status: "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED",
): status is "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED" =>
  status === "SUBMITTED" || status === "TIMED_OUT" || status === "VIOLATION_TERMINATED";

export async function fetchEmployerExamsAction(
  payload: FetchEmployerExamsInput,
): Promise<ActionResult<EmployerExamSummary[]>> {
  const exams = await prisma.exam.findMany({
    where: {
      employerId: payload.employerId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      totalCandidates: true,
      totalSlots: true,
      negativeMarking: true,
      duration: true,
      createdAt: true,
      updatedAt: true,
      slots: {
        select: {
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
      },
      attempts: {
        where: {
          status: {
            in: ["SUBMITTED", "TIMED_OUT", "VIOLATION_TERMINATED"],
          },
        },
        select: {
          id: true,
          score: true,
          violations: true,
          textAnswersGradedAt: true,
          status: true,
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
            },
          },
          candidate: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return {
    success: true,
    data: exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      totalCandidates: exam.totalCandidates,
      totalSlots: exam.totalSlots,
      totalQuestionSets: exam.slots.filter((slot) => slot.questionSet !== null).length,
      totalQuestions: exam.slots.reduce(
        (total, slot) => total + (slot.questionSet?.questions.length ?? 0),
        0,
      ),
      duration: exam.duration,
      negativeMarking: exam.negativeMarking,
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
      candidates: exam.attempts
        .filter((attempt) => isFinalAttemptStatus(attempt.status))
        .map((attempt) => ({
          attemptId: attempt.id,
          candidateName: attempt.candidate.name ?? attempt.candidate.email,
          score: attempt.score,
          violations: attempt.violations,
          requiresTextGrading: attempt.answers.length > 0,
          isTextGraded: attempt.answers.length === 0 || attempt.textAnswersGradedAt !== null,
          status: attempt.status,
        }))
        .sort((a, b) => (b.score ?? Number.NEGATIVE_INFINITY) - (a.score ?? Number.NEGATIVE_INFINITY)),
    })),
  };
}
