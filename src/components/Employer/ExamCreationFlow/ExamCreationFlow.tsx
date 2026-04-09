"use client";

import axios, { AxiosError } from "axios";
import { useMemo, useState } from "react";
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

const toSlotDatetime = (value: string) => {
  if (!value) {
    return "";
  }
  return new Date(value).toISOString();
};

export function ExamCreationFlow() {
  const router = useRouter();
  const {
    step,
    basicInfo,
    slots,
    activeSlotNumber,
    setStep,
    setBasicInfo,
    setSlotTiming,
    setActiveSlotNumber,
    addQuestion,
    removeQuestion,
    resetDraft,
  } = useExamDraftStore();

  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const submitExam = async () => {
    setRequestError(null);

    const hasQuestionsForAllSlots = slots.every((slot) => slot.questions.length > 0);
    if (!hasQuestionsForAllSlots) {
      setRequestError("Each slot must have at least one question.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        title: basicInfo.title,
        totalCandidates: basicInfo.totalCandidates,
        duration: basicInfo.duration,
        negativeMarking: false,
        slots: slots.map((slot) => ({
          slotNumber: slot.slotNumber,
          name: `Question Set ${slot.slotNumber}`,
          startTime: toSlotDatetime(slot.startTime),
          endTime: toSlotDatetime(slot.endTime),
          questions: slot.questions.map((question, index) => ({
            title: question.title,
            type: question.type,
            points: question.points,
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

      resetDraft();
      router.push(`/employer/dashboard?created=${response.data.data.examId}`);
      router.refresh();
    } catch (error) {
      if (error instanceof AxiosError) {
        setRequestError(error.response?.data?.error ?? "Unable to create exam.");
      } else {
        setRequestError("Unable to create exam.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Create New Test</h1>
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
            <Button disabled={!canContinue} onClick={() => setStep(2)}>
              Next: Add Questions
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
            <QuestionDialog
              onCreate={(question) => {
                addQuestion(activeSlotNumber, question);
              }}
            />
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(activeSlot.slotNumber, question.id)}
                    >
                      Remove
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
            <Button disabled={isSubmitting} onClick={submitExam}>
              {isSubmitting ? "Creating Test..." : "Create Test"}
            </Button>
          </div>
        </section>
      )}
    </main>
  );
}

export type EmployerDraftSlot = DraftSlot;
