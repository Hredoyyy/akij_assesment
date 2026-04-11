"use client";

import { QuestionPreviewCard } from "@/components/Employer/components/QuestionPreviewCard/QuestionPreviewCard";
import type { QuestionListPanelProps } from "@/types/employer/components";

export function QuestionListPanel({ questions, onEditQuestion, onDeleteQuestion }: QuestionListPanelProps) {
  if (questions.length === 0) {
    return (
      <section className="mx-auto mt-4 w-full max-w-[954px] rounded-2xl bg-white p-6">
        <p className="text-sm text-slate-600">No questions added yet.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-4 w-full max-w-[954px] space-y-4">
      {questions.map((question, index) => (
        <QuestionPreviewCard
          key={question.id}
          question={question}
          questionNumber={index + 1}
          onEdit={onEditQuestion}
          onDelete={onDeleteQuestion}
        />
      ))}
    </section>
  );
}
