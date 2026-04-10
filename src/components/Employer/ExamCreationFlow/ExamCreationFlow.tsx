"use client";

import axios, { AxiosError } from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { QuestionDialog } from "@/components/Employer/QuestionDialog/QuestionDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useExamDraftStore,
  type DraftQuestion,
  type DraftSlot,
} from "@/stores/examDraftStore";

type CreateExamResponse = {
  success: true;
  data: {
    examId: string;
  };
};

type ExistingExamDraft = {
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

type QuestionPersistInput = {
  title: string;
  type: "CHECKBOX" | "RADIO" | "TEXT";
  points: number;
  options: Array<{ text: string; isCorrect: boolean }>;
};

type ExamCreationFlowProps = {
  mode: "new" | "edit";
  initialDraft?: ExistingExamDraft;
};

const toSlotDatetime = (value: string) => {
  if (!value) {
    return "";
  }
  return new Date(value).toISOString();
};

export function ExamCreationFlow({ mode, initialDraft }: ExamCreationFlowProps) {
  const router = useRouter();
  const {
    examId,
    step,
    basicInfo,
    slots,
    activeSlotNumber,
    hydrateDraft,
    setExamId,
    setStep,
    setBasicInfo,
    setSlotTiming,
    setActiveSlotNumber,
    addQuestion,
    updateQuestion,
    removeQuestion,
    resetDraft,
  } = useExamDraftStore();

  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initializedModeRef = useRef<"new" | "edit" | null>(null);

  useEffect(() => {
    if (mode === "new") {
      if (initializedModeRef.current !== "new") {
        resetDraft();
        initializedModeRef.current = "new";
      }
      return;
    }

    initializedModeRef.current = "edit";

    if (!initialDraft) {
      return;
    }

    if (examId === initialDraft.examId) {
      return;
    }

    hydrateDraft({
      examId: initialDraft.examId,
      basicInfo: initialDraft.basicInfo,
      slots: initialDraft.slots.map((slot) => ({
        slotNumber: slot.slotNumber,
        startTime: slot.startTime,
        endTime: slot.endTime,
        questions: slot.questions.map((question) => ({
          id: crypto.randomUUID(),
          title: question.title,
          type: question.type,
          points: question.points,
          options: question.options.map((option) => ({
            id: crypto.randomUUID(),
            text: option.text,
            isCorrect: option.isCorrect,
          })),
        })),
      })),
    });
  }, [examId, hydrateDraft, initialDraft, mode, resetDraft]);

  const activeSlot = useMemo(
    () => slots.find((slot) => slot.slotNumber === activeSlotNumber) ?? slots[0],
    [activeSlotNumber, slots],
  );

  const canContinue = useMemo(() => {
    if (!basicInfo.title.trim()) {
      return false;
    }

    if (basicInfo.totalCandidates < 1 || basicInfo.duration < 1) {
      return false;
    }

    if (basicInfo.totalSlots < 1 || basicInfo.totalSlots > 3) {
      return false;
    }

    return slots.every(
      (slot) =>
        slot.startTime.trim().length > 0 &&
        slot.endTime.trim().length > 0 &&
        new Date(slot.endTime) > new Date(slot.startTime),
    );
  }, [basicInfo, slots]);

  const saveExam = async ({
    exitAfterSave,
    slotsOverride,
  }: {
    exitAfterSave: boolean;
    slotsOverride?: DraftSlot[];
  }) => {
    setRequestError(null);

    try {
      setIsSubmitting(true);

      const effectiveSlots = slotsOverride ?? slots;

      const payload = {
        examId: examId ?? undefined,
        title: basicInfo.title,
        totalCandidates: basicInfo.totalCandidates,
        duration: basicInfo.duration,
        negativeMarking: Boolean(basicInfo.negativeMarking),
        slots: effectiveSlots.map((slot) => ({
          slotNumber: slot.slotNumber,
          name: `Question Set ${slot.slotNumber}`,
          startTime: toSlotDatetime(slot.startTime),
          endTime: toSlotDatetime(slot.endTime),
          questions: slot.questions.map((question, index) => ({
            title: question.title,
            type: question.type,
            points: Number.isFinite(question.points) ? question.points : 1,
            order: index,
            options:
              question.type === "TEXT"
                ? []
                : question.options.map((option) => ({
                    text: option.text,
                    isCorrect: option.isCorrect,
                  })),
          })),
        })),
      };

      const response = await axios.post<CreateExamResponse>("/api/exams", payload);
      const savedExamId = response.data.data.examId;

      if (exitAfterSave) {
        resetDraft();
        router.push(`/employer/dashboard?saved=${savedExamId}`);
        router.refresh();
        return;
      }

      setExamId(savedExamId);
      if (step === 1) {
        setStep(2);
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        setRequestError(error.response?.data?.error ?? "Unable to save exam.");
      } else {
        setRequestError("Unable to save exam.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const addQuestionAndPersist = async (question: QuestionPersistInput): Promise<void> => {
    const nextSlots = slots.map((slot) => {
      if (slot.slotNumber !== activeSlotNumber) {
        return slot;
      }

      return {
        ...slot,
        questions: [
          ...slot.questions,
          {
            ...question,
            id: crypto.randomUUID(),
            options: question.options.map((option) => ({
              ...option,
              id: crypto.randomUUID(),
            })),
          },
        ],
      };
    });

    addQuestion(activeSlotNumber, question);
    await saveExam({ exitAfterSave: false, slotsOverride: nextSlots });
  };

  const editQuestionAndPersist = async (
    questionId: string,
    question: QuestionPersistInput,
  ): Promise<void> => {
    const nextSlots = slots.map((slot) => {
      if (slot.slotNumber !== activeSlotNumber) {
        return slot;
      }

      return {
        ...slot,
        questions: slot.questions.map((currentQuestion) => {
          if (currentQuestion.id !== questionId) {
            return currentQuestion;
          }

          return {
            ...currentQuestion,
            title: question.title,
            type: question.type,
            points: question.points,
            options: question.options.map((option) => ({
              ...option,
              id: crypto.randomUUID(),
            })),
          };
        }),
      };
    });

    updateQuestion(activeSlotNumber, questionId, question);
    await saveExam({ exitAfterSave: false, slotsOverride: nextSlots });
  };

  const removeQuestionAndPersist = async (slotNumber: number, questionId: string): Promise<void> => {
    const nextSlots = slots.map((slot) => {
      if (slot.slotNumber !== slotNumber) {
        return slot;
      }

      return {
        ...slot,
        questions: slot.questions.filter((question) => question.id !== questionId),
      };
    });

    removeQuestion(slotNumber, questionId);
    await saveExam({ exitAfterSave: false, slotsOverride: nextSlots });
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Manage Online Test</h1>
        <p className="mt-2 text-sm text-slate-600">Step {step} of 2</p>
      </header>

      {step === 1 ? (
        <section className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="test-name">Online Test Name</Label>
              <Input
                id="test-name"
                value={basicInfo.title}
                onChange={(event) => setBasicInfo({ title: event.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="total-candidates">Total Candidates</Label>
              <Input
                id="total-candidates"
                type="number"
                min={1}
                value={basicInfo.totalCandidates ?? 1}
                onChange={(event) =>
                  setBasicInfo({ totalCandidates: Number(event.target.value || 1) })
                }
              />
            </div>

            <div>
              <Label>Total Slots (max 3)</Label>
              <Select
                value={String(basicInfo.totalSlots ?? 1)}
                onValueChange={(value) => setBasicInfo({ totalSlots: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select total slots" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="question-sets">Total Question Sets</Label>
              <Input id="question-sets" value={basicInfo.totalSlots ?? 1} disabled readOnly />
            </div>

            <div>
              <Label htmlFor="duration">Duration (minutes, same for all slots)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={basicInfo.duration ?? 30}
                onChange={(event) => setBasicInfo({ duration: Number(event.target.value || 1) })}
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2 mt-2">
              <input
                id="negative-marking"
                type="checkbox"
                checked={basicInfo.negativeMarking}
                onChange={(e) => setBasicInfo({ negativeMarking: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="negative-marking">Negative Marking</Label>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 p-4">
            <h2 className="text-base font-semibold text-slate-900">Slot Timings</h2>
            {slots.map((slot) => (
              <div key={slot.slotNumber} className="grid gap-4 md:grid-cols-3">
                <div className="flex items-end text-sm font-medium text-slate-700">
                  Slot {slot.slotNumber}
                </div>
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={slot.startTime ?? ""}
                    onChange={(event) =>
                      setSlotTiming(slot.slotNumber, {
                        startTime: event.target.value,
                        endTime: slot.endTime,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={slot.endTime ?? ""}
                    onChange={(event) =>
                      setSlotTiming(slot.slotNumber, {
                        startTime: slot.startTime,
                        endTime: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => {
                resetDraft();
                router.push("/employer/dashboard");
              }}
            >
              Cancel
            </Button>
            <Button disabled={!canContinue || isSubmitting} onClick={() => saveExam({ exitAfterSave: false })}>
              {isSubmitting ? "Saving..." : "Save and Continue"}
            </Button>
          </div>
        </section>
      ) : (
        <section className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <Button
                key={slot.slotNumber}
                variant={activeSlotNumber === slot.slotNumber ? "default" : "outline"}
                onClick={() => setActiveSlotNumber(slot.slotNumber)}
              >
                Slot {slot.slotNumber}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Questions for Slot {activeSlot?.slotNumber}
            </h2>
            <QuestionDialog onSave={addQuestionAndPersist} />
          </div>

          {activeSlot && activeSlot.questions.length > 0 ? (
            <div className="space-y-3">
              {activeSlot.questions.map((question: DraftQuestion, index: number) => (
                <article key={question.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Question {index + 1}</p>
                      <h3 className="text-sm font-semibold text-slate-900">{question.title}</h3>
                      <p className="mt-1 text-xs text-slate-600">
                        Type: {question.type} • Points: {question.points}
                      </p>
                    </div>
                    <QuestionDialog
                      onSave={(updatedQuestion) =>
                        editQuestionAndPersist(question.id, updatedQuestion)
                      }
                      triggerLabel="Edit"
                      triggerVariant="outline"
                      triggerSize="sm"
                      dialogTitle="Edit Question"
                      dialogDescription="Update this question and save the changes to this slot."
                      submitLabel="Save Changes"
                      showSaveAndAddMore={false}
                      initialQuestion={{
                        title: question.title,
                        type: question.type,
                        points: question.points,
                        options: question.options.map((option) => ({
                          text: option.text,
                          isCorrect: option.isCorrect,
                        })),
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestionAndPersist(activeSlot.slotNumber, question.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">No questions added for this slot yet.</p>
          )}

          {requestError ? <p className="text-sm text-rose-600">{requestError}</p> : null}

          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back to Basic Info
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                resetDraft();
                router.push("/employer/dashboard");
              }}
            >
              Go Back to Dashboard
            </Button>
          </div>
        </section>
      )}
    </main>
  );
}

export type EmployerDraftSlot = DraftSlot;
