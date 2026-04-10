import { z } from "zod";

export const fetchExamDraftSchema = z.object({
  examId: z.string().uuid(),
  employerId: z.string().uuid(),
});

export type FetchExamDraftInput = z.infer<typeof fetchExamDraftSchema>;
