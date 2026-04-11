"use client";

import { ClockFading, FileText, Users } from "lucide-react";
import { useRouter } from "next/navigation";

import { CandidateRankingDialog } from "@/components/Employer/components/CandidateRankingDialog/CandidateRankingDialog";
import type { EmployerExamCardProps } from "@/types/employer/components";

export function EmployerExamCard({ exam }: EmployerExamCardProps) {
  const router = useRouter();
  const editHref = `/employer/tests/new?examId=${exam.id}&v=${new Date(exam.updatedAt).getTime()}`;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => router.push(editHref)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(editHref);
        }
      }}
      className="flex w-full max-w-[632px] cursor-pointer flex-col justify-center gap-6 rounded-2xl border border-slate-200 bg-white px-8 py-8"
    >
      <div className="space-y-5">
        <h3 className="text-xl font-semibold leading-[140%] text-slate-700">{exam.title}</h3>
        <div className="flex flex-wrap items-center justify-between gap-6 text-[16px] leading-[150%] text-slate-500">
          <div className="flex items-center gap-3">
            <Users className="h-7 w-7 shrink-0 text-slate-400" strokeWidth={1.8} />
            <p>
              Candidates: <span className="font-semibold text-slate-700">{exam.totalCandidates}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <FileText className="h-7 w-7 shrink-0 text-slate-400" strokeWidth={1.8} />
            <p>
              Question Set: <span className="font-semibold text-slate-700">{exam.totalQuestionSets}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ClockFading className="h-7 w-7 shrink-0 text-slate-400" strokeWidth={1.8} />
            <p>
              Exam Slots: <span className="font-semibold text-slate-700">{exam.totalSlots}</span>
            </p>
          </div>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center gap-3"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <CandidateRankingDialog
          examId={exam.id}
          examTitle={exam.title}
          candidates={exam.candidates.map((candidate) => ({
            attemptId: candidate.attemptId,
            candidateName: candidate.candidateName,
            score: candidate.score,
            violations: candidate.violations,
            requiresTextGrading: candidate.requiresTextGrading,
            isTextGraded: candidate.isTextGraded,
            status: candidate.status,
          }))}
        />
      </div>
    </article>
  );
}
