"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ExamFlowProgressCardProps } from "@/types/employer/components";

export function ExamFlowProgressCard({ step, onBackToDashboard, onStepClick }: ExamFlowProgressCardProps) {
  const isQuestionStep = step === 2;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold leading-[140%] text-slate-700">Manage Online Test</h1>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="flex items-center gap-2"
              onClick={() => onStepClick?.(1)}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
                {isQuestionStep ? <Check className="h-4 w-4" /> : <span className="text-xs font-medium">1</span>}
              </span>
              <span className={`text-sm ${isQuestionStep ? "font-medium text-slate-700" : "font-medium text-primary"}`}>
                Basic Info
              </span>
            </button>
            <span className="h-px w-20 bg-slate-400" />
            <button
              type="button"
              className="flex items-center gap-2"
              onClick={() => onStepClick?.(2)}
            >
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-white ${isQuestionStep ? "bg-primary" : "bg-slate-300"}`}>
                {isQuestionStep ? <Check className="h-4 w-4" /> : <span className="text-xs font-medium">2</span>}
              </span>
              <span className={`text-sm ${isQuestionStep ? "font-medium text-slate-700" : "text-slate-500"}`}>
                Questions Sets
              </span>
            </button>
          </div>

          <Button
            variant="outline"
            className="h-10 rounded-xl px-6 text-sm font-semibold"
            onClick={onBackToDashboard}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </section>
  );
}
