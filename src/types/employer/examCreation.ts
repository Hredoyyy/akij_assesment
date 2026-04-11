import type { DraftSlot } from "@/stores/examDraftStore";

export type CreateExamResponse = {
  success: true;
  data: {
    examId: string;
  };
};

export type ExistingExamDraft = {
  examId: string;
  basicInfo: {
    title: string;
    totalCandidates: number;
    totalSlots: number;
    duration: number;
    negativeMarking: boolean;
  };
  slots: Array<{
    slotNumber: number;
    startTime: string;
    endTime: string;
    questions: Array<{
      title: string;
      type: "CHECKBOX" | "RADIO" | "TEXT";
      points: number;
      options: Array<{ text: string; isCorrect: boolean }>;
    }>;
  }>;
};

export type QuestionPersistInput = {
  title: string;
  type: "CHECKBOX" | "RADIO" | "TEXT";
  points: number;
  options: Array<{ text: string; isCorrect: boolean }>;
};

export type ExamCreationFlowProps = {
  mode: "new" | "edit";
  initialDraft?: ExistingExamDraft;
};

export type EmployerDraftSlot = DraftSlot;
