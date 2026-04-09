import { z } from "zod";

export const fetchEmployerExamsSchema = z.object({
  employerId: z.string().uuid(),
});

export type FetchEmployerExamsInput = z.infer<typeof fetchEmployerExamsSchema>;
