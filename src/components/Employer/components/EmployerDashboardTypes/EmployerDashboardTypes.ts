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
    attemptId: string;
    candidateName: string;
    score: number | null;
    violations: number;
    requiresTextGrading: boolean;
    isTextGraded: boolean;
    status: "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED";
  }>;
};
