export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED";

export type CandidateRow = {
  attemptId: string;
  candidateName: string;
  score: number | null;
  violations: number;
  requiresTextGrading: boolean;
  isTextGraded: boolean;
  status: AttemptStatus;
};

export type GradingQuestion = {
  answerId: string;
  questionId: string;
  questionTitle: string;
  maxPoints: number;
  textAnswer: string;
  awardedPoints: number;
};

export type FetchTextAnswersResponse = {
  success: true;
  data: {
    attemptId: string;
    candidateName: string;
    currentScore: number;
    textAnswers: GradingQuestion[];
  };
};

export type GradeTextAnswersResponse = {
  success: true;
  data: {
    score: number;
  };
};

export type CandidateFilter = "ALL" | "GRADED" | "UNGRADED";

export type CandidateRankingDialogProps = {
  examId: string;
  examTitle: string;
  candidates: CandidateRow[];
};
