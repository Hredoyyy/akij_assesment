"use client";

import { CalendarClock, CircleX, Clock3, FileText } from "lucide-react";

import type { CandidateAvailableExam } from "@/components/Candidate/components/CandidateDashboardTypes/CandidateDashboardTypes";

type CandidateExamCardProps = {
  exam: CandidateAvailableExam;
  startingExamId: string | null;
  currentTimestamp: number;
  onStartExam: (examId: string) => void;
};

export function CandidateExamCard({
  exam,
  startingExamId,
  currentTimestamp,
  onStartExam,
}: CandidateExamCardProps) {
  const slotStartLabel = new Date(exam.slotStartTime).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const slotEndLabel = new Date(exam.slotEndTime).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isUpcoming = new Date(exam.slotStartTime).getTime() > currentTimestamp;
  const isCompleted =
    exam.attemptStatus === "SUBMITTED" ||
    exam.attemptStatus === "TIMED_OUT" ||
    exam.attemptStatus === "VIOLATION_TERMINATED";

  const isStarting = startingExamId === exam.examId;
  const canStartFromCard = !isCompleted && !isUpcoming && !isStarting;

  const actionLabel = isStarting
    ? "Starting..."
    : isCompleted
      ? "Attempt Completed"
      : isUpcoming
        ? "Not Started Yet"
        : exam.attemptStatus === "IN_PROGRESS"
          ? "Resume"
          : "Start";

  return (
    <article
      key={`${exam.examId}-${exam.slotNumber}`}
      role="button"
      tabIndex={0}
      onClick={() => {
        if (canStartFromCard) {
          onStartExam(exam.examId);
        }
      }}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && canStartFromCard) {
          event.preventDefault();
          onStartExam(exam.examId);
        }
      }}
      className={`flex min-h-[181px] w-full max-w-[632px] flex-col justify-center gap-6 rounded-2xl border border-[#E5E7EB] bg-white p-6 ${
        canStartFromCard ? "cursor-pointer" : "cursor-default"
      }`}
    >
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-semibold leading-[140%] text-slate-700">{exam.title}</h3>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Clock3 className="h-5 w-5 text-[#9CA3AF]" aria-hidden="true" />
            <span className="font-normal">Duration:</span>
            <span className="font-medium">{exam.duration} min</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-700">
            <FileText className="h-5 w-5 text-[#9CA3AF]" aria-hidden="true" />
            <span className="font-normal text-slate-500">Question:</span>
            <span className="font-medium text-slate-700">{exam.questionCount}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-700">
            <CircleX className="h-5 w-5 text-[#9CA3AF]" aria-hidden="true" />
            <span className="font-normal">Negative Marking:</span>
            <span className="font-medium">{exam.negativeMarking ? "-0.25/wrong" : "No"}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <CalendarClock className="h-5 w-5 text-slate-400" aria-hidden="true" />
          <span className="font-medium">Slot {exam.slotNumber}:</span>
          <span className="font-normal text-slate-600">{slotStartLabel} - {slotEndLabel}</span>
        </div>
      </div>

      <div
        className="mt-1"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <button
          type="button"
          disabled={isCompleted || isUpcoming || isStarting}
          onClick={() => {
            onStartExam(exam.examId);
          }}
          className="inline-flex h-10 min-w-[140px] items-center justify-center rounded-xl border border-[#6633FF] px-6 text-sm font-semibold leading-[140%] text-[#6633FF] transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
}