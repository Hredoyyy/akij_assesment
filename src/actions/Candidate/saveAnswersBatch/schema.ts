import { z } from "zod";

const singleAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionIds: z.array(z.string().uuid()).default([]),
  textAnswer: z.string().trim().optional(),
});

export const saveAnswersBatchSchema = z.object({
  candidateId: z.string().uuid(),
  attemptId: z.string().uuid(),
  answers: z.array(singleAnswerSchema),
});

export type SaveAnswersBatchInput = z.infer<typeof saveAnswersBatchSchema>;
