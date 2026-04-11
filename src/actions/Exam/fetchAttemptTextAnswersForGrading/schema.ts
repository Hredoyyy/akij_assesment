import { z } from "zod";

export const fetchAttemptTextAnswersForGradingSchema = z.object({
  employerId: z.string().uuid(),
  examId: z.string().uuid(),
  attemptId: z.string().uuid(),
});

export type FetchAttemptTextAnswersForGradingInput = z.infer<
  typeof fetchAttemptTextAnswersForGradingSchema
>;
