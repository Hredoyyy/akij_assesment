"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";

import { AttemptResultCard } from "@/components/Candidate/components/AttemptResultCard/AttemptResultCard";
import { AttemptTerminationDialog } from "@/components/Candidate/components/AttemptTerminationDialog/AttemptTerminationDialog";
import { RichTextEditor } from "@/components/Shared/RichTextEditor/RichTextEditor";
import { Button } from "@/components/ui/button";
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

type SubmitAttemptResponse = {
  success: true;
  data: {
    attemptId: string;
    status: "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED";
    score: number | null;
  };
};

type AnswerDraftPayload = {
  currentQuestionIndex: number;
  answers: RuntimeAnswer[];
};

type CandidateAttemptRunnerProps = {
  attemptId: string;
  initialRuntime: AttemptRuntime;
  candidateDisplayName: string;
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

const hasTextContent = (value: string | null | undefined): boolean => {
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

export function CandidateAttemptRunner({
  attemptId,
  initialRuntime,
  candidateDisplayName,
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
  const [finishedStatus, setFinishedStatus] = useState<
    "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED" | null
  >(
    initialRuntime.status === "IN_PROGRESS" ? null : initialRuntime.status,
  );
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

  const submitAttempt = useCallback(async (status: "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED") => {
    const response = await axios.post<SubmitAttemptResponse>(
      `/api/candidate/attempts/${attemptId}/submit`,
      { status },
    );

    clearDraftFromStorage(attemptId);
    setRuntime((prev) => ({
      ...prev,
      status: response.data.data.status,
    }));

    return response.data.data.status;
  }, [attemptId]);

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
    const answers = runtime.questions.flatMap((question) => {
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

    await axios.post("/api/candidate/answers/batch", {
      attemptId,
      answers,
    });
  }, [answerState, attemptId, runtime.questions]);

  const submitAttemptWithSavedAnswers = useCallback(
    async (
      status: "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED",
      options?: { skipSave?: boolean },
    ) => {
      if (!options?.skipSave) {
        await saveAllAnswers();
      }

      const nextStatus = await submitAttempt(status);
      setFinishedStatus(nextStatus);
      return nextStatus;
    },
    [saveAllAnswers, submitAttempt],
  );

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
      await submitAttemptWithSavedAnswers("SUBMITTED");
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
      submitAttemptWithSavedAnswers={submitAttemptWithSavedAnswers}
      saveAllAnswers={saveAllAnswers}
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
      finishedStatus={finishedStatus}
      onBackToDashboard={() => {
        router.push("/candidate/dashboard");
        router.refresh();
      }}
      candidateDisplayName={candidateDisplayName}
    />
  );
}

type AttemptRuntimeViewProps = {
  attemptId: string;
  runtime: AttemptRuntime;
  answerState: Record<string, RuntimeAnswer>;
  isSubmitting: boolean;
  submitAttemptWithSavedAnswers: (
    status: "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED",
    options?: { skipSave?: boolean },
  ) => Promise<"SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED">;
  saveAllAnswers: () => Promise<void>;
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
  finishedStatus: "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED" | null;
  onBackToDashboard: () => void;
  candidateDisplayName: string;
};

function AttemptRuntimeView({
  attemptId,
  runtime,
  answerState,
  isSubmitting,
  submitAttemptWithSavedAnswers,
  saveAllAnswers,
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
  finishedStatus,
  onBackToDashboard,
  candidateDisplayName,
}: AttemptRuntimeViewProps) {
  const { remainingSeconds } = useExamTimer({
    initialSeconds: runtime.remainingSeconds,
    onExpire: async () => {
      if (runtime.status !== "IN_PROGRESS") {
        return;
      }

      await submitAttemptWithSavedAnswers("TIMED_OUT");
    },
  });

  useBehaviorTracking({
    enabled: runtime.status === "IN_PROGRESS",
    onViolation: async () => {
      if (runtime.status !== "IN_PROGRESS") {
        return;
      }

      try {
        const willTerminateOnThisViolation = runtime.violations + 1 >= 3;

        // Persist currently answered questions before the server flips attempt status.
        if (willTerminateOnThisViolation) {
          await saveAllAnswers();
        }

        const response = await axios.post(`/api/candidate/attempts/${attemptId}/violation`);
        const terminated = Boolean(response.data?.data?.terminated);

        if (terminated) {
          await submitAttemptWithSavedAnswers("VIOLATION_TERMINATED", { skipSave: true });
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
      } catch {
        setRequestError("Unable to finalize this violation right now. Please try again.");
      }
    },
  });

  if (finishedStatus === "SUBMITTED") {
    return (
      <AttemptResultCard
        examTitle={runtime.examTitle}
        candidateDisplayName={candidateDisplayName}
        onBackToDashboard={onBackToDashboard}
      />
    );
  }

  return (
    <>
      <section className="mx-auto mt-12 w-full max-w-[849px] space-y-6">
      <header className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-[20px] font-medium leading-6 text-slate-700">
            Question ({Math.min(currentQuestionIndex + 1, runtime.questions.length)}/{runtime.questions.length})
          </p>
          <div className="inline-flex h-[54px] min-w-[220px] items-center justify-center rounded-xl bg-[#F3F4F6] px-8">
            <p className="text-center text-[20px] font-semibold leading-6 text-slate-700">
              {toTimeText(remainingSeconds)} left
            </p>
          </div>
        </div>
      </header>

      <p className="text-sm font-medium text-slate-600">Violations: {runtime.violations} / 3</p>

      {!isOnline ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          You are offline. Answers are being saved on this device and will remain available.
        </p>
      ) : null}

      {view === "question" && currentQuestion ? (
        <>
          <article className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <h2
              className="candidate-rich-text text-3xl font-medium leading-6 text-slate-700"
              dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(currentQuestion.title) }}
            />

            {currentQuestion.type === "TEXT" ? (
              <div className="mt-6">
                <RichTextEditor
                  value={answerState[currentQuestion.id]?.textAnswer ?? ""}
                  onChange={(nextValue) => {
                    updateAnswer({
                      attemptId,
                      questionId: currentQuestion.id,
                      selectedOptionIds: [],
                      textAnswer: nextValue,
                    });
                  }}
                  placeholder="Type questions here.."
                  minHeightClassName="min-h-[181px]"
                  showUnderline
                />
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {currentQuestion.options.map((option) => {
                  const checked =
                    answerState[currentQuestion.id]?.selectedOptionIds?.includes(option.id) ?? false;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-lg border border-[#E5E7EB] px-4 py-[14px] text-left text-slate-700"
                      onClick={() => {
                        const previous = answerState[currentQuestion.id]?.selectedOptionIds ?? [];
                        let selectedOptionIds = previous;

                        if (currentQuestion.type === "RADIO") {
                          selectedOptionIds = checked ? [] : [option.id];
                        } else if (checked) {
                          selectedOptionIds = previous.filter((id) => id !== option.id);
                        } else {
                          selectedOptionIds = [...previous, option.id];
                        }

                        updateAnswer({
                          attemptId,
                          questionId: currentQuestion.id,
                          selectedOptionIds,
                        });
                      }}
                    >
                      <span
                        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center ${
                          currentQuestion.type === "RADIO"
                            ? "rounded-full border"
                            : "rounded-md border"
                        } ${checked ? "border-primary" : "border-[#9CA3AF]"}`}
                        aria-hidden="true"
                      >
                        {checked ? (
                          currentQuestion.type === "RADIO" ? (
                            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                          ) : (
                            <Check className="h-4 w-4 text-primary" strokeWidth={2.4} />
                          )
                        ) : null}
                      </span>
                      <span
                        className="candidate-rich-text text-base font-normal leading-[19px] text-slate-700"
                        dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(option.text) }}
                      />
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-5">
              <Button
                variant="outline"
                onClick={() => {
                  setRequestError(null);
                  if (isLastQuestion) {
                    setView("review");
                    return;
                  }

                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                }}
                className="h-12 min-w-[180px] rounded-xl border-[#E5E7EB] bg-white px-8 text-base font-semibold text-slate-700"
              >
                Skip this Question
              </Button>

              <Button
                onClick={() => {
                  setRequestError(null);
                  if (isLastQuestion) {
                    setView("review");
                    return;
                  }

                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                }}
                className="h-12 min-w-[180px] rounded-xl bg-primary px-8 text-base font-semibold text-white"
              >
                {isLastQuestion ? "Save & Review" : "Save & Continue"}
              </Button>
            </div>
          </article>
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
                        answer?.textAnswer?.trim() ? (
                          <div
                            className="candidate-rich-text mt-1 text-sm text-slate-600"
                            dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(answer.textAnswer) }}
                          />
                        ) : (
                          <p className="mt-1 text-sm text-slate-600">No answer saved</p>
                        )
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

      <AttemptTerminationDialog
        open={finishedStatus === "TIMED_OUT" || finishedStatus === "VIOLATION_TERMINATED"}
        status={finishedStatus === "VIOLATION_TERMINATED" ? "VIOLATION_TERMINATED" : "TIMED_OUT"}
        examTitle={runtime.examTitle}
        onBackToDashboard={onBackToDashboard}
      />
    </>
  );
}
