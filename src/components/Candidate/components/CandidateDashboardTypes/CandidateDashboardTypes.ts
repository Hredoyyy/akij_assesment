export type CandidateAvailableExam = {
  examId: string;
  title: string;
  duration: number;
  questionCount: number;
  negativeMarking: boolean;
  slotNumber: number;
  slotStartTime: string;
  slotEndTime: string;
  attemptStatus: "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED" | null;
};