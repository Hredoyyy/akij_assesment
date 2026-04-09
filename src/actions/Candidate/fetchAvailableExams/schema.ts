import { z } from "zod";

export const fetchAvailableExamsSchema = z.object({
  candidateId: z.string().uuid(),
});

export type FetchAvailableExamsInput = z.infer<typeof fetchAvailableExamsSchema>;
