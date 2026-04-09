import { z } from "zod";

export const incrementViolationSchema = z.object({
  candidateId: z.string().uuid(),
  attemptId: z.string().uuid(),
});

export type IncrementViolationInput = z.infer<typeof incrementViolationSchema>;
