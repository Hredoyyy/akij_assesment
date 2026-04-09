import { z } from "zod";

export const submitAttemptSchema = z.object({
  candidateId: z.string().uuid(),
  attemptId: z.string().uuid(),
  status: z.enum(["SUBMITTED", "TIMED_OUT", "VIOLATION_TERMINATED"]),
});

export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
