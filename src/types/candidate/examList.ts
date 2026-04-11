import type { CandidateAvailableExam } from "@/types/candidate/dashboard";

export type CandidateExamListProps = {
  exams: CandidateAvailableExam[];
};

export type StartAttemptResponse = {
  success: true;
  data: {
    attemptId: string;
  };
};

export type ExamStartPolicyDialogProps = {
  open: boolean;
  examTitle: string | null;
  isStarting: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
};
