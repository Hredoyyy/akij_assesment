import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/result";

import type { FetchEmployerExamsInput } from "./schema";

type EmployerExamSummary = {
  id: string;
  title: string;
  totalCandidates: number;
  totalSlots: number;
  duration: number;
  createdAt: Date;
};

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
      duration: true,
      createdAt: true,
    },
  });

  return {
    success: true,
    data: exams,
  };
}
