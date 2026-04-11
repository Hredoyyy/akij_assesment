"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";

import { AttemptResultCard } from "@/components/Candidate/components/AttemptResultCard/AttemptResultCard";
import { AttemptTerminationDialog } from "@/components/Candidate/components/AttemptTerminationDialog/AttemptTerminationDialog";
import { RichTextEditor } from "@/components/Shared/RichTextEditor/RichTextEditor";
import { Button } from "@/components/ui/button";
import { useBehaviorTracking } from "@/hooks/useBehaviorTracking";
import { useExamTimer } from "@/hooks/useExamTimer";
import {
  buildSaveBatchAnswers,
  clearDraftFromStorage,
  readDraftFromStorage,
  toAnswerState,
  toTimeText,
  writeDraftToStorage,
} from "@/lib/candidate/attemptRuntime";
import { sanitizeRichTextHtml } from "@/lib/richText";
import type {
  AttemptFinalStatus,
  AttemptRuntime,
  AttemptRuntimeViewProps,
  CandidateAttemptRunnerProps,
  RuntimeAnswer,
  SaveAnswerInput,
  SubmitAttemptResponse,
} from "@/types/candidate/attempt";

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
  const [finishedStatus, setFinishedStatus] = useState<AttemptFinalStatus | null>(
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

  const submitAttempt = useCallback(async (status: AttemptFinalStatus) => {
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
    const answers = buildSaveBatchAnswers(runtime.questions, answerState);

    await axios.post("/api/candidate/answers/batch", {
      attemptId,
      answers,
    });
  }, [answerState, attemptId, runtime.questions]);

  const submitAttemptWithSavedAnswers = useCallback(
    async (
      status: AttemptFinalStatus,
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
  const getFullscreenElement = useCallback(() => {
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      msFullscreenElement?: Element | null;
    };

    return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? doc.msFullscreenElement ?? null;
  }, []);

  const isInFullscreen = useCallback(() => Boolean(getFullscreenElement()), [getFullscreenElement]);

  const [isFullscreenReady, setIsFullscreenReady] = useState(
    typeof document === "undefined" ? true : isInFullscreen(),
  );
  const [isRequestingFullscreen, setIsRequestingFullscreen] = useState(false);

  const requestFullscreen = useCallback(async () => {
    if (typeof document === "undefined") {
      setIsFullscreenReady(true);
      return true;
    }

    if (isInFullscreen()) {
      setIsFullscreenReady(true);
      setRequestError(null);
      return true;
    }

    const root = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };

    const fullscreenRequest =
      root.requestFullscreen?.bind(root) ??
      root.webkitRequestFullscreen?.bind(root) ??
      root.msRequestFullscreen?.bind(root);

    if (!fullscreenRequest) {
      // If Fullscreen API is unavailable on the browser/device, avoid blocking the attempt UI.
      setIsFullscreenReady(true);
      setRequestError(null);
      return true;
    }

    try {
      setIsRequestingFullscreen(true);
      await fullscreenRequest();
      setIsFullscreenReady(true);
      setRequestError(null);
      return true;
    } catch {
      setIsFullscreenReady(false);
      setRequestError(
        "Fullscreen mode is required for the exam. Click 'Enter Fullscreen' to continue.",
      );
      return false;
    } finally {
      setIsRequestingFullscreen(false);
    }
  }, [isInFullscreen, setRequestError]);

  useEffect(() => {
    if (runtime.status !== "IN_PROGRESS") {
      return;
    }

    void requestFullscreen();
  }, [requestFullscreen, runtime.status]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = isInFullscreen();
      setIsFullscreenReady(active);
      if (active) {
        setRequestError(null);
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange as EventListener);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange as EventListener);
    };
  }, [isInFullscreen, setRequestError]);

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
      {runtime.status === "IN_PROGRESS" && !isFullscreenReady ? (
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-900">Enter Fullscreen to Continue</h2>
          <p className="mt-2 text-sm text-amber-800">
            Fullscreen mode is mandatory during the exam. Exiting fullscreen counts as a violation.
          </p>
          <Button
            className="mt-4 rounded-xl"
            onClick={() => {
              void requestFullscreen();
            }}
            disabled={isRequestingFullscreen}
          >
            {isRequestingFullscreen ? "Requesting Fullscreen..." : "Enter Fullscreen"}
          </Button>
        </article>
      ) : null}

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

      <div
        className={`rounded-xl border px-4 py-3 ${
          runtime.violations >= 2
            ? "border-rose-300 bg-rose-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`h-5 w-5 ${runtime.violations >= 2 ? "text-rose-600" : "text-amber-600"}`}
              aria-hidden="true"
            />
            <p
              className={`text-sm font-semibold ${
                runtime.violations >= 2 ? "text-rose-700" : "text-amber-700"
              }`}
            >
              Violation Monitor
            </p>
          </div>
          <p
            className={`text-lg font-bold ${
              runtime.violations >= 2 ? "text-rose-700" : "text-amber-700"
            }`}
          >
            {runtime.violations} / 3
          </p>
        </div>
      </div>

      {!isOnline ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          You are offline. Answers are being saved on this device and will remain available.
        </p>
      ) : null}

      {view === "question" && currentQuestion && isFullscreenReady ? (
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

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                className="h-12 w-full rounded-xl border-[#E5E7EB] bg-white px-8 text-base font-semibold text-slate-700 sm:w-auto sm:min-w-[180px]"
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
                className="h-12 w-full rounded-xl bg-primary px-8 text-base font-semibold text-white sm:w-auto sm:min-w-[180px]"
              >
                {isLastQuestion ? "Save & Review" : "Save & Continue"}
              </Button>
            </div>
          </article>
        </>
      ) : null}

      {view === "review" && isFullscreenReady ? (
        <>
          <article className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-medium leading-6 text-slate-700">Final Review</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Confirm your responses before submitting the exam.
                </p>
              </div>
              <div className="inline-flex items-center rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                {runtime.questions.length} Questions
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {runtime.questions.map((question, index) => {
                const answer = answerState[question.id];
                const selectedOptions = question.options
                  .filter((option) => answer?.selectedOptionIds?.includes(option.id))
                  .map((option) => option.text);

                return (
                  <article key={question.id} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
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
                        className="rounded-lg border-[#E5E7EB] px-4 text-slate-700"
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
          </article>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between">
            <Button
              variant="outline"
              className="h-12 w-full rounded-xl border-[#E5E7EB] bg-white px-8 text-base font-semibold text-slate-700 sm:w-auto sm:min-w-[180px]"
              onClick={() => setView("question")}
            >
              Back to Questions
            </Button>
            <Button
              className="h-12 w-full rounded-xl bg-primary px-8 text-base font-semibold text-white sm:w-auto sm:min-w-[180px]"
              disabled={isSubmitting}
              onClick={() => void submitFinalAttempt()}
            >
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
