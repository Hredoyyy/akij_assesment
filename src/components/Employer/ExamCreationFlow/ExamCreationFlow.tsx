"use client";

import axios, { AxiosError } from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import { QuestionDialog } from "@/components/Employer/QuestionDialog/QuestionDialog";
import { ExamFlowProgressCard } from "@/components/Employer/components/ExamFlowProgressCard/ExamFlowProgressCard";
import { QuestionListPanel } from "@/components/Employer/components/QuestionListPanel/QuestionListPanel";
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
} from "@/stores/examDraftStore";
import { toSlotDatetime } from "@/lib/employer/examCreation";
import type {
  CreateExamResponse,
  EmployerDraftSlot,
  ExamCreationFlowProps,
  QuestionPersistInput,
} from "@/types/employer/examCreation";

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
  const [basicInfoMode, setBasicInfoMode] = useState<"view" | "edit">(
    mode === "new" ? "edit" : "view",
  );
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

  const questionTypeLabel = useMemo(() => {
    const allTypes = new Set(slots.flatMap((slot) => slot.questions.map((question) => question.type)));

    if (allTypes.size === 0) {
      return "MCQ";
    }

    if (allTypes.size > 1) {
      return "Mixed";
    }

    const [singleType] = Array.from(allTypes);

    if (singleType === "RADIO") {
      return "MCQ";
    }

    if (singleType === "CHECKBOX") {
      return "Checkbox";
    }

    return "Text";
  }, [slots]);

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
    slotsOverride?: EmployerDraftSlot[];
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
    <main className="mx-auto w-full max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8">
      <ExamFlowProgressCard
        step={step}
        onBackToDashboard={() => {
          resetDraft();
          router.push("/employer/dashboard");
        }}
        onStepClick={(targetStep) => {
          if (targetStep === 1 && step === 2) {
            setStep(1);
          }
        }}
      />

      {step === 1 ? (
        <>
          <section className="mx-auto mt-8 w-full max-w-[954px] rounded-2xl bg-white p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold leading-[140%] text-slate-700">Basic Information</h2>

                {basicInfoMode === "view" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-primary hover:bg-primary/5"
                    onClick={() => setBasicInfoMode("edit")}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                ) : null}
              </div>

              {basicInfoMode === "view" ? (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-sm font-normal text-slate-500">Online Test Title</p>
                    <p className="text-2xl font-medium leading-[150%] text-slate-700">{basicInfo.title || "-"}</p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-4">
                    <div className="space-y-1">
                      <p className="text-sm font-normal text-slate-500">Total Candidates</p>
                      <p className="text-base font-medium text-slate-700">{basicInfo.totalCandidates}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-normal text-slate-500">Total Slots</p>
                      <p className="text-base font-medium text-slate-700">{basicInfo.totalSlots}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-normal text-slate-500">Total Question Set</p>
                      <p className="text-base font-medium text-slate-700">{slots.length}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-normal text-slate-500">Duration Per Slots (Minutes)</p>
                      <p className="text-base font-medium text-slate-700">{basicInfo.duration}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-normal text-slate-500">Question Type</p>
                    <p className="text-base font-medium text-slate-700">{questionTypeLabel}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Label htmlFor="test-name" className="text-sm font-medium text-slate-700">
                        Online Test Title <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="test-name"
                        placeholder="Enter online test title"
                        value={basicInfo.title}
                        onChange={(event) => setBasicInfo({ title: event.target.value })}
                        className="mt-2 h-12 rounded-lg border-slate-200"
                      />
                    </div>

                    <div>
                      <Label htmlFor="total-candidates" className="text-sm font-medium text-slate-700">
                        Total Candidates <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="total-candidates"
                        type="number"
                        min={1}
                        placeholder="Enter total candidates"
                        value={basicInfo.totalCandidates ?? 1}
                        onChange={(event) =>
                          setBasicInfo({ totalCandidates: Number(event.target.value || 1) })
                        }
                        className="mt-2 h-12 rounded-lg border-slate-200"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-slate-700">
                        Total Slots <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        value={String(basicInfo.totalSlots ?? 1)}
                        onValueChange={(value) => setBasicInfo({ totalSlots: Number(value) })}
                      >
                        <SelectTrigger className="mt-2 h-12 rounded-lg border-slate-200">
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
                      <Label htmlFor="question-sets" className="text-sm font-medium text-slate-700">
                        Total Question Set <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="question-sets"
                        value={basicInfo.totalSlots ?? 1}
                        disabled
                        readOnly
                        className="mt-2 h-12 rounded-lg border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="duration" className="text-sm font-medium text-slate-700">
                        Duration
                      </Label>
                      <Input
                        id="duration"
                        type="number"
                        min={1}
                        placeholder="Duration Time"
                        value={basicInfo.duration ?? 30}
                        onChange={(event) => setBasicInfo({ duration: Number(event.target.value || 1) })}
                        className="mt-2 h-12 rounded-lg border-slate-200"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center gap-2">
                      <input
                        id="negative-marking"
                        type="checkbox"
                        checked={basicInfo.negativeMarking}
                        onChange={(e) => setBasicInfo({ negativeMarking: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="negative-marking" className="text-sm font-medium text-slate-700">
                        Negative Marking
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {slots.map((slot) => (
                      <div key={slot.slotNumber} className="grid gap-6 md:grid-cols-3">
                        <div>
                          <Label className="text-sm font-medium text-slate-700">
                            Start Time (Slot {slot.slotNumber}) <span className="text-rose-500">*</span>
                          </Label>
                          <Input
                            type="datetime-local"
                            value={slot.startTime ?? ""}
                            onChange={(event) =>
                              setSlotTiming(slot.slotNumber, {
                                startTime: event.target.value,
                                endTime: slot.endTime,
                              })
                            }
                            className="mt-2 h-12 rounded-lg border-slate-200"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-slate-700">
                            End Time (Slot {slot.slotNumber}) <span className="text-rose-500">*</span>
                          </Label>
                          <Input
                            type="datetime-local"
                            value={slot.endTime ?? ""}
                            onChange={(event) =>
                              setSlotTiming(slot.slotNumber, {
                                startTime: slot.startTime,
                                endTime: event.target.value,
                              })
                            }
                            className="mt-2 h-12 rounded-lg border-slate-200"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-slate-700">Duration</Label>
                          <Input
                            value={`${basicInfo.duration || 0} min`}
                            disabled
                            readOnly
                            className="mt-2 h-12 rounded-lg border-slate-200 bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="mx-auto mt-6 w-full max-w-[954px] rounded-2xl bg-white p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <Button
                variant="outline"
                className="h-12 w-full rounded-xl text-base font-semibold sm:w-auto sm:min-w-[180px]"
                onClick={() => {
                  resetDraft();
                  router.push("/employer/dashboard");
                }}
              >
                Cancel
              </Button>
              <Button
                className="h-12 w-full rounded-xl text-base font-semibold sm:w-auto sm:min-w-[180px]"
                disabled={basicInfoMode === "edit" ? !canContinue || isSubmitting : isSubmitting}
                onClick={() => {
                  if (basicInfoMode === "view") {
                    setStep(2);
                    return;
                  }

                  void saveExam({ exitAfterSave: false });
                }}
              >
                {isSubmitting ? "Saving..." : "Save & Continue"}
              </Button>
            </div>
          </section>

          {requestError ? <p className="mx-auto mt-3 w-full max-w-[954px] text-sm text-rose-600">{requestError}</p> : null}
        </>
      ) : (
        <>
          {slots.length > 1 ? (
            <section className="mx-auto mt-4 w-full max-w-[954px] rounded-2xl bg-white p-6">
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
            </section>
          ) : null}

          {activeSlot ? (
            <QuestionListPanel
              questions={activeSlot.questions}
              onEditQuestion={(questionId, updatedQuestion) =>
                editQuestionAndPersist(questionId, updatedQuestion)
              }
              onDeleteQuestion={(questionId) => removeQuestionAndPersist(activeSlot.slotNumber, questionId)}
            />
          ) : null}

          <section className="mx-auto mt-4 w-full max-w-[954px] rounded-2xl bg-white p-6">
            <QuestionDialog
              onSave={addQuestionAndPersist}
              triggerLabel="Add Question"
              triggerClassName="h-14 w-full rounded-xl text-lg font-semibold"
            />
          </section>

          {requestError ? (
            <p className="mx-auto mt-3 w-full max-w-[954px] text-sm text-rose-600">{requestError}</p>
          ) : null}
        </>
      )}
    </main>
  );
}

export type { EmployerDraftSlot } from "@/types/employer/examCreation";
