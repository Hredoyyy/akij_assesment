"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBehaviorTracking } from "@/hooks/useBehaviorTracking";
import { useExamTimer } from "@/hooks/useExamTimer";
import { sanitizeRichTextHtml } from "@/lib/richText";

type RuntimeQuestion = {
  id: string;
  title: string;
  type: "CHECKBOX" | "RADIO" | "TEXT";
  points: number;
  order: number;
  options: Array<{ id: string; text: string }>;
};

type RuntimeAnswer = {
  questionId: string;
  selectedOptionIds: string[];
  textAnswer: string | null;
};

type AttemptRuntime = {
  attemptId: string;
  examId: string;
  examTitle: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED";
  durationMinutes: number;
  remainingSeconds: number;
  violations: number;
  questions: RuntimeQuestion[];
  answers: RuntimeAnswer[];
};

type SaveAnswerInput = {
  attemptId: string;
  questionId: string;
  selectedOptionIds: string[];
  textAnswer?: string;
};

type AnswerDraftPayload = {
  currentQuestionIndex: number;
  answers: RuntimeAnswer[];
};

type CandidateAttemptRunnerProps = {
  attemptId: string;
  initialRuntime: AttemptRuntime;
};

const toTimeText = (seconds: number) => {
  const min = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const sec = (seconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
};

const getAnswerDraftKey = (attemptId: string) => `attempt-${attemptId}-answers-draft-v1`;

const toAnswerState = (answers: RuntimeAnswer[]) =>
  answers.reduce<Record<string, RuntimeAnswer>>((acc, answer) => {
    acc[answer.questionId] = answer;
    return acc;
  }, {});

const readDraftFromStorage = (attemptId: string): AnswerDraftPayload | null => {
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

const writeDraftToStorage = (
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

const clearDraftFromStorage = (attemptId: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getAnswerDraftKey(attemptId));
};

export function CandidateAttemptRunner({
  attemptId,
  initialRuntime,
}: CandidateAttemptRunnerProps) {
  const router = useRouter();
  const [runtime, setRuntime] = useState<AttemptRuntime>(initialRuntime);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState<"question" | "review">("question");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [requestError, setRequestError] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<Record<string, RuntimeAnswer>>(
    toAnswerState(initialRuntime.answers),
  );

  useEffect(() => {
    const localDraft = readDraftFromStorage(attemptId);

    if (!localDraft) {
      return;
    }

    const merged = {
      ...toAnswerState(initialRuntime.answers),
      ...toAnswerState(localDraft.answers),
    };

    setAnswerState(merged);

    const maxIndex = Math.max(0, initialRuntime.questions.length - 1);
    setCurrentQuestionIndex(Math.min(localDraft.currentQuestionIndex, maxIndex));
  }, [attemptId, initialRuntime.answers, initialRuntime.questions.length]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    writeDraftToStorage(attemptId, currentQuestionIndex, answerState);
  }, [answerState, attemptId, currentQuestionIndex]);

  const submitAttempt = useCallback(
    async (status: "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED") => {
      await axios.post(`/api/candidate/attempts/${attemptId}/submit`, { status });
      clearDraftFromStorage(attemptId);
      router.push("/candidate/dashboard");
      router.refresh();
    },
    [attemptId, router],
  );

  const updateAnswer = (payload: SaveAnswerInput) => {
    setAnswerState((prev) => ({
      ...prev,
      [payload.questionId]: {
        questionId: payload.questionId,
        selectedOptionIds: payload.selectedOptionIds,
        textAnswer: payload.textAnswer ?? null,
      },
    }));
  };

  const saveAllAnswers = useCallback(async () => {
    const answers = runtime.questions.map((question) => {
      const answer = answerState[question.id];

      return {
        questionId: question.id,
        selectedOptionIds: answer?.selectedOptionIds ?? [],
        textAnswer: question.type === "TEXT" ? answer?.textAnswer ?? "" : undefined,
      };
    });

    await axios.post("/api/candidate/answers/batch", {
      attemptId,
      answers,
    });
  }, [answerState, attemptId, runtime.questions]);

  const currentQuestion = runtime.questions[currentQuestionIndex] ?? null;
  const isLastQuestion = currentQuestionIndex === runtime.questions.length - 1;

  const submitFinalAttempt = async () => {
    setRequestError(null);

    if (!isOnline) {
      setRequestError(
        "You are offline. Your answers are saved locally. Reconnect to submit the exam.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await saveAllAnswers();
      await submitAttempt("SUBMITTED");
    } catch {
      setRequestError("Unable to submit exam right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AttemptRuntimeView
      key={runtime.attemptId}
      attemptId={attemptId}
      runtime={runtime}
      answerState={answerState}
      isSubmitting={isSubmitting}
      submitAttempt={submitAttempt}
      setRuntime={setRuntime}
      updateAnswer={updateAnswer}
      currentQuestion={currentQuestion}
      currentQuestionIndex={currentQuestionIndex}
      setCurrentQuestionIndex={setCurrentQuestionIndex}
      isLastQuestion={isLastQuestion}
      view={view}
      setView={setView}
      submitFinalAttempt={submitFinalAttempt}
      isOnline={isOnline}
      requestError={requestError}
      setRequestError={setRequestError}
    />
  );
}

type AttemptRuntimeViewProps = {
  attemptId: string;
  runtime: AttemptRuntime;
  answerState: Record<string, RuntimeAnswer>;
  isSubmitting: boolean;
  submitAttempt: (status: "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED") => Promise<void>;
  setRuntime: React.Dispatch<React.SetStateAction<AttemptRuntime>>;
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
};

function AttemptRuntimeView({
  attemptId,
  runtime,
  answerState,
  isSubmitting,
  submitAttempt,
  setRuntime,
  updateAnswer,
  currentQuestion,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  isLastQuestion,
  view,
  setView,
  submitFinalAttempt,
  isOnline,
  requestError,
  setRequestError,
}: AttemptRuntimeViewProps) {
  const { remainingSeconds } = useExamTimer({
    initialSeconds: runtime.remainingSeconds,
    onExpire: async () => {
      if (runtime.status !== "IN_PROGRESS") {
        return;
      }

      await submitAttempt("TIMED_OUT");
    },
  });

  useBehaviorTracking({
    enabled: runtime.status === "IN_PROGRESS",
    onViolation: async () => {
      if (runtime.status !== "IN_PROGRESS") {
        return;
      }

      const response = await axios.post(`/api/candidate/attempts/${attemptId}/violation`);
      const terminated = Boolean(response.data?.data?.terminated);

      if (terminated) {
        await submitAttempt("VIOLATION_TERMINATED");
        return;
      }

      setRuntime((prev) =>
        prev
          ? {
              ...prev,
              violations: Number(response.data?.data?.violations ?? prev.violations),
            }
          : prev,
      );
    },
  });

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{runtime.examTitle}</h1>
          <p className="mt-1 text-sm text-slate-600">Violations: {runtime.violations} / 3</p>
        </div>
        <div className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900">
          Time Left: {toTimeText(remainingSeconds)}
        </div>
      </header>

      {!isOnline ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          You are offline. Answers are being saved on this device and will remain available.
        </p>
      ) : null}

      {view === "question" && currentQuestion ? (
        <>
          <article className="mt-6 rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">
              Question {currentQuestionIndex + 1} of {runtime.questions.length}
            </p>
            <h2
              className="candidate-rich-text mt-1 text-sm font-semibold text-slate-900"
              dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(currentQuestion.title) }}
            />

            {currentQuestion.type === "TEXT" ? (
              <div className="mt-3">
                <Input
                  value={answerState[currentQuestion.id]?.textAnswer ?? ""}
                  onChange={(event) => {
                    updateAnswer({
                      attemptId,
                      questionId: currentQuestion.id,
                      selectedOptionIds: [],
                      textAnswer: event.target.value,
                    });
                  }}
                  placeholder="Type your answer"
                />
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {currentQuestion.options.map((option) => {
                  const checked =
                    answerState[currentQuestion.id]?.selectedOptionIds?.includes(option.id) ?? false;

                  return (
                    <label key={option.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type={currentQuestion.type === "RADIO" ? "radio" : "checkbox"}
                        name={currentQuestion.id}
                        checked={checked}
                        onChange={(event) => {
                          const previous = answerState[currentQuestion.id]?.selectedOptionIds ?? [];
                          let selectedOptionIds = previous;

                          if (currentQuestion.type === "RADIO") {
                            selectedOptionIds = event.target.checked ? [option.id] : [];
                          } else if (event.target.checked) {
                            selectedOptionIds = [...previous, option.id];
                          } else {
                            selectedOptionIds = previous.filter((id) => id !== option.id);
                          }

                          updateAnswer({
                            attemptId,
                            questionId: currentQuestion.id,
                            selectedOptionIds,
                          });
                        }}
                      />
                      <span
                        className="candidate-rich-text"
                        dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(option.text) }}
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </article>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => {
                setRequestError(null);
                if (isLastQuestion) {
                  setView("review");
                  return;
                }

                setCurrentQuestionIndex(currentQuestionIndex + 1);
              }}
            >
              {isLastQuestion ? "Save and Review Answers" : "Save and Continue"}
            </Button>
          </div>
        </>
      ) : null}

      {view === "review" ? (
        <>
          <div className="mt-6 space-y-4">
            {runtime.questions.map((question, index) => {
              const answer = answerState[question.id];
              const selectedOptions = question.options
                .filter((option) => answer?.selectedOptionIds?.includes(option.id))
                .map((option) => option.text);

              return (
                <article key={question.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-start gap-1 text-sm font-semibold text-slate-900">
                        <span>{index + 1}.</span>
                        <h2
                          className="candidate-rich-text"
                          dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(question.title) }}
                        />
                      </div>
                      {question.type === "TEXT" ? (
                        <p className="mt-1 text-sm text-slate-600">
                          {answer?.textAnswer?.trim() || "No answer saved"}
                        </p>
                      ) : selectedOptions.length > 0 ? (
                        <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-slate-600">
                          {selectedOptions.map((selectedOption, selectedOptionIndex) => (
                            <li
                              key={`${question.id}-${selectedOptionIndex}`}
                              className="candidate-rich-text"
                              dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(selectedOption) }}
                            />
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-sm text-slate-600">No answer saved</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentQuestionIndex(index);
                        setView("question");
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <Button variant="outline" onClick={() => setView("question")}>
              Back to Questions
            </Button>
            <Button disabled={isSubmitting} onClick={() => void submitFinalAttempt()}>
              {isSubmitting ? "Submitting..." : "Submit Exam"}
            </Button>
          </div>
        </>
      ) : null}

      {requestError ? <p className="mt-4 text-sm text-rose-600">{requestError}</p> : null}
    </section>
  );
}
