import { z } from "zod";

export const startAttemptSchema = z.object({
  candidateId: z.string().uuid(),
  examId: z.string().uuid(),
});

export type StartAttemptInput = z.infer<typeof startAttemptSchema>;
