import { z } from "zod";

const gradeEntrySchema = z.object({
  answerId: z.string().uuid(),
  awardedPoints: z.number().min(0),
});

export const gradeAttemptTextAnswersSchema = z.object({
  employerId: z.string().uuid(),
  examId: z.string().uuid(),
  attemptId: z.string().uuid(),
  grades: z.array(gradeEntrySchema),
});

export type GradeAttemptTextAnswersInput = z.infer<typeof gradeAttemptTextAnswersSchema>;
