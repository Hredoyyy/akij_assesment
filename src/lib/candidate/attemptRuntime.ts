import type {
  AnswerDraftPayload,
  RuntimeAnswer,
  RuntimeQuestion,
  SaveAnswerBatchPayload,
} from "@/types/candidate/attempt";

const getAnswerDraftKey = (attemptId: string) => `attempt-${attemptId}-answers-draft-v1`;

export const toTimeText = (seconds: number) => {
  const min = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const sec = (seconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
};

export const toAnswerState = (answers: RuntimeAnswer[]) =>
  answers.reduce<Record<string, RuntimeAnswer>>((acc, answer) => {
    acc[answer.questionId] = answer;
    return acc;
  }, {});

export const readDraftFromStorage = (attemptId: string): AnswerDraftPayload | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getAnswerDraftKey(attemptId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AnswerDraftPayload>;
    const answers = Array.isArray(parsed.answers)
      ? parsed.answers.map((answer) => ({
          questionId: String(answer.questionId ?? ""),
          selectedOptionIds: Array.isArray(answer.selectedOptionIds)
            ? answer.selectedOptionIds.map((id) => String(id))
            : [],
          textAnswer:
            answer.textAnswer === null || typeof answer.textAnswer === "string"
              ? answer.textAnswer
              : null,
        }))
      : [];

    return {
      currentQuestionIndex: Math.max(0, Number(parsed.currentQuestionIndex ?? 0)),
      answers,
    };
  } catch {
    return null;
  }
};

export const writeDraftToStorage = (
  attemptId: string,
  currentQuestionIndex: number,
  answerState: Record<string, RuntimeAnswer>,
) => {
  if (typeof window === "undefined") {
    return;
  }

  const payload: AnswerDraftPayload = {
    currentQuestionIndex,
    answers: Object.values(answerState),
  };

  window.localStorage.setItem(getAnswerDraftKey(attemptId), JSON.stringify(payload));
};

export const clearDraftFromStorage = (attemptId: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getAnswerDraftKey(attemptId));
};

export const hasTextContent = (value: string | null | undefined): boolean => {
  if (!value?.trim()) {
    return false;
  }

  if (typeof window === "undefined") {
    return value.trim().length > 0;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(value, "text/html");
  const plainText = (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();

  return plainText.length > 0;
};

export const buildSaveBatchAnswers = (
  questions: RuntimeQuestion[],
  answerState: Record<string, RuntimeAnswer>,
): SaveAnswerBatchPayload[] => {
  return questions.flatMap((question) => {
    const answer = answerState[question.id];
    const selectedOptionIds = answer?.selectedOptionIds ?? [];
    const textAnswer = answer?.textAnswer ?? "";

    if (question.type === "TEXT") {
      if (!hasTextContent(textAnswer)) {
        return [];
      }

      return [
        {
          questionId: question.id,
          selectedOptionIds: [],
          textAnswer,
        },
      ];
    }

    if (selectedOptionIds.length === 0) {
      return [];
    }

    return [
      {
        questionId: question.id,
        selectedOptionIds,
      },
    ];
  });
};
