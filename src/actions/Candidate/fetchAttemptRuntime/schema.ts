import { z } from "zod";

export const fetchAttemptRuntimeSchema = z.object({
  candidateId: z.string().uuid(),
  attemptId: z.string().uuid(),
});

export type FetchAttemptRuntimeInput = z.infer<typeof fetchAttemptRuntimeSchema>;
