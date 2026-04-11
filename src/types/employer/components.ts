import type { EmployerExamSummary } from "@/components/Employer/components/EmployerDashboardTypes/EmployerDashboardTypes";
import type { DraftQuestion } from "@/stores/examDraftStore";

export type EmployerDashboardHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

export type EmptyExamListStateProps = {
  title: string;
  description: string;
};

export type EmployerDashboardPanelProps = {
  exams: EmployerExamSummary[];
};

export type EmployerExamCardProps = {
  exam: EmployerExamSummary;
};

export type ExamFlowProgressCardProps = {
  step: 1 | 2;
  onBackToDashboard: () => void;
  onStepClick?: (step: 1 | 2) => void;
};

export type QuestionListPanelProps = {
  questions: DraftQuestion[];
  onEditQuestion: (
    questionId: string,
    question: Omit<DraftQuestion, "id" | "options"> & {
      options: Array<{ text: string; isCorrect: boolean }>;
    },
  ) => Promise<void>;
  onDeleteQuestion: (questionId: string) => Promise<void>;
};

export type QuestionPreviewCardProps = {
  question: DraftQuestion;
  questionNumber: number;
  onEdit: (
    questionId: string,
    question: Omit<DraftQuestion, "id" | "options"> & {
      options: Array<{ text: string; isCorrect: boolean }>;
    },
  ) => Promise<void>;
  onDelete: (questionId: string) => Promise<void>;
};
