"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBehaviorTracking } from "@/hooks/useBehaviorTracking";
import { useExamTimer } from "@/hooks/useExamTimer";
import { useOfflineSync } from "@/hooks/useOfflineSync";

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

export function CandidateAttemptRunner({
  attemptId,
  initialRuntime,
}: CandidateAttemptRunnerProps) {
  const router = useRouter();
  const [runtime, setRuntime] = useState<AttemptRuntime>(initialRuntime);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerState, setAnswerState] = useState<Record<string, RuntimeAnswer>>(
    initialRuntime.answers.reduce<Record<string, RuntimeAnswer>>((acc, answer) => {
      acc[answer.questionId] = answer;
      return acc;
    }, {}),
  );

  const queueKey = useMemo(() => `attempt-${attemptId}-offline-answers`, [attemptId]);

  const saveAnswer = useCallback(async (payload: SaveAnswerInput) => {
    await axios.post("/api/candidate/answers", payload);
  }, []);

  const { enqueue } = useOfflineSync({
    queueKey,
    onFlushItem: async (item) => {
      await saveAnswer(item);
    },
  });

  const submitAttempt = useCallback(
    async (status: "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED") => {
      await axios.post(`/api/candidate/attempts/${attemptId}/submit`, { status });
      router.push("/candidate/dashboard");
      router.refresh();
    },
    [attemptId, router],
  );

  const updateAnswer = async (payload: SaveAnswerInput) => {
    setAnswerState((prev) => ({
      ...prev,
      [payload.questionId]: {
        questionId: payload.questionId,
        selectedOptionIds: payload.selectedOptionIds,
        textAnswer: payload.textAnswer ?? null,
      },
    }));

    try {
      await saveAnswer(payload);
    } catch {
      enqueue(payload);
    }
  };

  return (
    <AttemptRuntimeView
      key={runtime.attemptId}
      attemptId={attemptId}
      runtime={runtime}
      answerState={answerState}
      isSubmitting={isSubmitting}
      setIsSubmitting={setIsSubmitting}
      submitAttempt={submitAttempt}
      setRuntime={setRuntime}
      updateAnswer={updateAnswer}
    />
  );
}

type AttemptRuntimeViewProps = {
  attemptId: string;
  runtime: AttemptRuntime;
  answerState: Record<string, RuntimeAnswer>;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  submitAttempt: (status: "SUBMITTED" | "TIMED_OUT" | "VIOLATION_TERMINATED") => Promise<void>;
  setRuntime: React.Dispatch<React.SetStateAction<AttemptRuntime>>;
  updateAnswer: (payload: SaveAnswerInput) => Promise<void>;
};

function AttemptRuntimeView({
  attemptId,
  runtime,
  answerState,
  isSubmitting,
  setIsSubmitting,
  submitAttempt,
  setRuntime,
  updateAnswer,
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

      <div className="mt-6 space-y-4">
        {runtime.questions.map((question, index) => {
          const answer = answerState[question.id];

          return (
            <article key={question.id} className="rounded-xl border border-slate-200 p-4">
              <h2 className="text-sm font-semibold text-slate-900">
                {index + 1}. {question.title}
              </h2>

              {question.type === "TEXT" ? (
                <div className="mt-3">
                  <Input
                    value={answer?.textAnswer ?? ""}
                    onChange={(event) => {
                      void updateAnswer({
                        attemptId,
                        questionId: question.id,
                        selectedOptionIds: [],
                        textAnswer: event.target.value,
                      });
                    }}
                    placeholder="Type your answer"
                  />
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {question.options.map((option) => {
                    const checked =
                      answer?.selectedOptionIds?.includes(option.id) ?? false;

                    return (
                      <label key={option.id} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type={question.type === "RADIO" ? "radio" : "checkbox"}
                          name={question.id}
                          checked={checked}
                          onChange={(event) => {
                            let selectedOptionIds = answer?.selectedOptionIds ?? [];

                            if (question.type === "RADIO") {
                              selectedOptionIds = event.target.checked ? [option.id] : [];
                            } else if (event.target.checked) {
                              selectedOptionIds = [...selectedOptionIds, option.id];
                            } else {
                              selectedOptionIds = selectedOptionIds.filter(
                                (id) => id !== option.id,
                              );
                            }

                            void updateAnswer({
                              attemptId,
                              questionId: question.id,
                              selectedOptionIds,
                            });
                          }}
                        />
                        {option.text}
                      </label>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          disabled={isSubmitting}
          onClick={async () => {
            setIsSubmitting(true);
            try {
              await submitAttempt("SUBMITTED");
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          {isSubmitting ? "Submitting..." : "Submit Exam"}
        </Button>
      </div>
    </section>
  );
}
