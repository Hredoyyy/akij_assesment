import type { DraftQuestionType } from "@/stores/examDraftStore";

export type QuestionInput = {
  title: string;
  type: DraftQuestionType;
  points: number;
  options: Array<{ text: string; isCorrect: boolean }>;
};

export type QuestionDialogProps = {
  onSave: (question: QuestionInput) => Promise<void>;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "ghost";
  triggerSize?: "default" | "sm";
  triggerClassName?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  submitLabel?: string;
  showSaveAndAddMore?: boolean;
  initialQuestion?: QuestionInput;
};

export type LocalOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};
