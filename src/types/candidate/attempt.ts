import type { Dispatch, SetStateAction } from "react";

export type AttemptFinalStatus = "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED";

export type RuntimeQuestion = {
  id: string;
  title: string;
  type: "CHECKBOX" | "RADIO" | "TEXT";
  points: number;
  order: number;
  options: Array<{ id: string; text: string }>;
};

export type RuntimeAnswer = {
  questionId: string;
  selectedOptionIds: string[];
  textAnswer: string | null;
};

export type AttemptRuntime = {
  attemptId: string;
  examId: string;
  examTitle: string;
  status: "IN_PROGRESS" | AttemptFinalStatus;
  durationMinutes: number;
  remainingSeconds: number;
  violations: number;
  questions: RuntimeQuestion[];
  answers: RuntimeAnswer[];
};

export type SaveAnswerInput = {
  attemptId: string;
  questionId: string;
  selectedOptionIds: string[];
  textAnswer?: string;
};

export type SubmitAttemptResponse = {
  success: true;
  data: {
    attemptId: string;
    status: AttemptFinalStatus;
    score: number | null;
  };
};

export type AnswerDraftPayload = {
  currentQuestionIndex: number;
  answers: RuntimeAnswer[];
};

export type SaveAnswerBatchPayload = {
  questionId: string;
  selectedOptionIds: string[];
  textAnswer?: string;
};

export type CandidateAttemptRunnerProps = {
  attemptId: string;
  initialRuntime: AttemptRuntime;
  candidateDisplayName: string;
};

export type AttemptRuntimeViewProps = {
  attemptId: string;
  runtime: AttemptRuntime;
  answerState: Record<string, RuntimeAnswer>;
  isSubmitting: boolean;
  submitAttemptWithSavedAnswers: (
    status: AttemptFinalStatus,
    options?: { skipSave?: boolean },
  ) => Promise<AttemptFinalStatus>;
  saveAllAnswers: () => Promise<void>;
  setRuntime: Dispatch<SetStateAction<AttemptRuntime>>;
  updateAnswer: (payload: SaveAnswerInput) => void;
  currentQuestion: RuntimeQuestion | null;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (value: number) => void;
  isLastQuestion: boolean;
  view: "question" | "review";
  setView: (value: "question" | "review") => void;
  submitFinalAttempt: () => Promise<void>;
  isOnline: boolean;
  requestError: string | null;
  setRequestError: (value: string | null) => void;
  finishedStatus: AttemptFinalStatus | null;
  onBackToDashboard: () => void;
  candidateDisplayName: string;
};
