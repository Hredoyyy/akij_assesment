"use client";

import { CheckCircle2 } from "lucide-react";

import { QuestionDialog } from "@/components/Employer/QuestionDialog/QuestionDialog";
import { Button } from "@/components/ui/button";
import type { DraftQuestion } from "@/stores/examDraftStore";

type QuestionPreviewCardProps = {
  question: DraftQuestion;
  questionNumber: number;
  onEdit: (questionId: string, question: Omit<DraftQuestion, "id" | "options"> & { options: Array<{ text: string; isCorrect: boolean }> }) => Promise<void>;
  onDelete: (questionId: string) => Promise<void>;
};

const typeLabelMap: Record<DraftQuestion["type"], string> = {
  RADIO: "MCQ",
  CHECKBOX: "Checkbox",
  TEXT: "Text",
};

export function QuestionPreviewCard({ question, questionNumber, onEdit, onDelete }: QuestionPreviewCardProps) {
  const preparedQuestion = {
    title: question.title,
    type: question.type,
    points: question.points,
    options: question.options.map((option) => ({
      text: option.text,
      isCorrect: option.isCorrect,
    })),
  };

  return (
    <article className="rounded-2xl bg-white p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-slate-700">Question {questionNumber}</h3>
          <div className="flex items-center gap-3">
            <span className="rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-500">
              {typeLabelMap[question.type]}
            </span>
            <span className="rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-500">
              {question.points} pt
            </span>
          </div>
        </div>

        <div className="h-px w-full bg-slate-200" />

        <div className="space-y-6">
          <p className="text-base font-semibold text-black">{question.title}</p>

          {question.type === "TEXT" ? (
            <p className="text-base leading-7 text-slate-700">
              Text-based answer question.
            </p>
          ) : (
            <div className="space-y-5">
              {question.options.map((option, index) => {
                const prefix = String.fromCharCode(65 + index);

                return option.isCorrect ? (
                  <div
                    key={option.id}
                    className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-3"
                  >
                    <p className="text-base text-slate-700">{prefix}. {option.text}</p>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                ) : (
                  <p key={option.id} className="px-3 text-base text-slate-700">
                    {prefix}. {option.text}
                  </p>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-px w-full bg-slate-200" />

        <div className="flex items-center justify-between">
          <QuestionDialog
            onSave={(updatedQuestion) => onEdit(question.id, updatedQuestion)}
            triggerLabel="Edit"
            triggerVariant="ghost"
            triggerSize="sm"
            triggerClassName="px-0 text-base font-medium text-primary hover:bg-transparent"
            dialogTitle="Edit Question"
            dialogDescription="Update this question and save the changes to this slot."
            submitLabel="Save"
            showSaveAndAddMore={false}
            initialQuestion={preparedQuestion}
          />

          <Button
            variant="ghost"
            size="sm"
            className="px-0 text-base font-medium text-rose-500 hover:bg-transparent"
            onClick={() => {
              void onDelete(question.id);
            }}
          >
            Remove From Exam
          </Button>
        </div>
      </div>
    </article>
  );
}
