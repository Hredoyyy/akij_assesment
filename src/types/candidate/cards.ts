import type { CandidateAvailableExam } from "@/types/candidate/dashboard";

export type CandidateExamCardProps = {
  exam: CandidateAvailableExam;
  startingExamId: string | null;
  currentTimestamp: number;
  onStartExam: (examId: string) => void;
};
