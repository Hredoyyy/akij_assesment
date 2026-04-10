export type EmployerExamSummary = {
  id: string;
  title: string;
  totalCandidates: number;
  totalSlots: number;
  totalQuestionSets: number;
  totalQuestions: number;
  duration: number;
  negativeMarking: boolean;
  createdAt: Date;
  updatedAt: Date;
  candidates: Array<{
    candidateName: string;
    score: number | null;
    status: "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED";
  }>;
};
