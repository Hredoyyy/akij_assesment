import { z } from "zod";

export const saveAnswerSchema = z.object({
  candidateId: z.string().uuid(),
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  selectedOptionIds: z.array(z.string().uuid()).default([]),
  textAnswer: z.string().trim().optional(),
});

export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;
